from pathlib import Path
from uuid import uuid4
import json

import redis

from celery.result import AsyncResult
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select

from app.core.config import settings
from app.database import get_db
from app.core.permissions import require_role
from app.routers.auth import get_current_user
from app.models.order import Order
from app.models.user import User
from app.tasks.background_tasks import (
    IMPORT_DIR,
    generate_all_order_invoices,
    generate_order_invoice,
    import_products_csv,
)
from app.tasks.celery_app import celery_app

router = APIRouter(prefix="/background", tags=["Background Jobs"])

INVOICE_TASK_META_PREFIX = "rebelmart:invoice-task:"
invoice_task_meta = redis.Redis.from_url(
    settings.REDIS_URL,
    db=4,
    decode_responses=True,
    socket_connect_timeout=1,
    socket_timeout=1,
)
INVOICE_TASK_META_TTL = 24 * 60 * 60


def _is_admin(user: User) -> bool:
    return user.role == "admin"


def _remember_invoice_task(task_id: str, order: Order) -> None:
    payload = {"order_id": order.id, "user_id": order.user_id}
    invoice_task_meta.setex(
        f"{INVOICE_TASK_META_PREFIX}{task_id}",
        INVOICE_TASK_META_TTL,
        json.dumps(payload),
    )


def _invoice_task_owner(task_id: str) -> dict | None:
    try:
        value = invoice_task_meta.get(f"{INVOICE_TASK_META_PREFIX}{task_id}")
    except redis.RedisError:
        return None
    if not value:
        return None
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return None


@router.post("/invoices/{order_id}", status_code=status.HTTP_202_ACCEPTED)
def start_invoice(
    order_id: int,
    db=Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    order = db.scalar(select(Order).where(Order.id == order_id))
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if not _is_admin(current_user) and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only generate invoices for your own orders")

    task = generate_order_invoice.delay(order_id)
    try:
        _remember_invoice_task(task.id, order)
    except redis.RedisError:
        # Task execution must not be blocked by optional tracking metadata.
        pass
    return {"task_id": task.id, "status": "PENDING", "message": "Invoice generation started"}


@router.post("/imports/products", status_code=status.HTTP_202_ACCEPTED)
def start_product_import(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("admin")),
) -> dict[str, str]:
    if not file.filename or Path(file.filename).suffix.lower() != ".csv":
        raise HTTPException(status_code=400, detail="Upload a .csv file")

    destination = IMPORT_DIR / f"{uuid4().hex}.csv"
    try:
        with destination.open("wb") as output:
            while chunk := file.file.read(1024 * 1024):
                output.write(chunk)
    except OSError as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Could not store CSV upload") from exc

    task = import_products_csv.delay(str(destination))
    return {"task_id": task.id, "status": "PENDING", "message": "CSV import started"}


@router.post("/invoices/bulk", status_code=status.HTTP_202_ACCEPTED)
def start_bulk_invoices(
    current_user: User = Depends(require_role("admin")),
) -> dict[str, str]:
    """Start a background job that generates and packages every order invoice."""
    task = generate_all_order_invoices.delay()

    try:
        invoice_task_meta.setex(
            f"{INVOICE_TASK_META_PREFIX}{task.id}",
            INVOICE_TASK_META_TTL,
            json.dumps({"user_id": current_user.id, "type": "bulk_invoice_zip"}),
        )
    except redis.RedisError:
        pass

    return {
        "task_id": task.id,
        "status": "PENDING",
        "message": "Bulk invoice generation started",
    }


@router.get("/invoices/bulk/{filename}")
def download_bulk_invoices(
    filename: str,
    current_user: User = Depends(require_role("admin")),
) -> FileResponse:
    """Download the ZIP containing all order invoices. Admin-only."""
    safe_name = Path(filename).name

    if (
        safe_name != filename
        or not safe_name.startswith("rebelmart-all-order-invoices-")
        or not safe_name.endswith(".zip")
    ):
        raise HTTPException(status_code=404, detail="Invoice archive not found")

    token = safe_name.removeprefix("rebelmart-all-order-invoices-").removesuffix(".zip")
    if len(token) != 12 or any(ch not in "0123456789abcdef" for ch in token.lower()):
        raise HTTPException(status_code=404, detail="Invoice archive not found")

    archive_path = (
        Path(__file__).resolve().parents[2]
        / "uploads"
        / "invoices"
        / safe_name
    )

    if not archive_path.is_file():
        raise HTTPException(status_code=404, detail="Invoice archive not found")

    return FileResponse(
        archive_path,
        media_type="application/zip",
        filename=safe_name,
    )


@router.get("/invoices/{filename}")
def download_invoice(filename: str, db=Depends(get_db), current_user: User = Depends(get_current_user)) -> FileResponse:
    safe_name = Path(filename).name
    if safe_name != filename or not safe_name.lower().endswith(".pdf"):
        raise HTTPException(status_code=404, detail="Invoice not found")

    parts = safe_name.removeprefix("invoice-").split("-")
    if len(parts) != 2:
        raise HTTPException(status_code=404, detail="Invoice not found")

    order_part = parts[0]
    random_part_with_extension = parts[1]
    random_part = random_part_with_extension[:-4]

    if (
        not order_part.isdigit()
        or not random_part_with_extension.endswith(".pdf")
        or len(random_part) != 12
        or any(ch not in "0123456789abcdef" for ch in random_part.lower())
    ):
        raise HTTPException(status_code=404, detail="Invoice not found")

    order_id = int(order_part)
    order = db.scalar(select(Order).where(Order.id == order_id))
    if order is None or (not _is_admin(current_user) and order.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="You do not have access to this invoice")

    invoice_path = Path(__file__).resolve().parents[2] / "uploads" / "invoices" / safe_name
    if not invoice_path.is_file():
        raise HTTPException(status_code=404, detail="Invoice not found")
    return FileResponse(invoice_path, media_type="application/pdf", filename=safe_name)


@router.get("/tasks/{task_id}")
def get_task_status(task_id: str, current_user: User = Depends(get_current_user)) -> dict:
    metadata = _invoice_task_owner(task_id)
    if not _is_admin(current_user):
        if not metadata or metadata.get("user_id") != current_user.id:
            raise HTTPException(status_code=403, detail="You do not have access to this background task")

    result = AsyncResult(task_id, app=celery_app)
    payload = result.result if isinstance(result.result, dict) else None

    response = {
        "task_id": task_id,
        "state": result.state,
        "ready": result.ready(),
        "successful": result.successful() if result.ready() else False,
        "failed": result.failed() if result.ready() else False,
        "result": payload if result.successful() else None,
        "error": str(result.result) if result.failed() else None,
        "progress": payload if result.state == "PROGRESS" else None,
    }
    return response
