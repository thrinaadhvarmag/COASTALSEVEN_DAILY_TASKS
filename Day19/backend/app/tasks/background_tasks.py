import csv
import logging
import os
import zipfile
from decimal import Decimal, InvalidOperation
from pathlib import Path
from uuid import uuid4

from celery import Task
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Spacer, Table, TableStyle, Paragraph
from sqlalchemy import select

from app.core.config import settings
from app.database import SessionLocal
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.tasks.celery_app import celery_app
from app.services.cache_service import clear_products_cache

logger = logging.getLogger("ecommerce.background")

INVOICE_DIR = settings.upload_dir_path.parent / "invoices"
IMPORT_DIR = settings.upload_dir_path.parent / "imports"
INVOICE_DIR.mkdir(parents=True, exist_ok=True)
IMPORT_DIR.mkdir(parents=True, exist_ok=True)


class ProgressTask(Task):
    abstract = True

    def progress(self, current: int, total: int, message: str) -> None:
        percent = int((current / total) * 100) if total else 100
        self.update_state(
            state="PROGRESS",
            meta={"current": current, "total": total, "percent": percent, "message": message},
        )


def _build_invoice_pdf(db, order: Order, output_path: Path) -> None:
    rows = db.execute(
        select(OrderItem, Product.name)
        .join(Product, Product.id == OrderItem.product_id)
        .where(OrderItem.order_id == order.id)
        .order_by(OrderItem.id)
    ).all()

    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )
    story = [
        Paragraph("Rebel Mart — Invoice", styles["Title"]),
        Spacer(1, 8),
        Paragraph(f"Invoice #{order.id}", styles["Heading2"]),
        Paragraph(f"Customer: {order.customer_name or 'Customer'}", styles["BodyText"]),
        Paragraph(f"Phone: {order.phone or 'N/A'}", styles["BodyText"]),
        Paragraph(
            "Address: "
            + ", ".join(filter(None, [order.address, order.city, order.state, order.pincode])),
            styles["BodyText"],
        ),
        Spacer(1, 12),
    ]
    data = [["Product", "Qty", "Unit Price", "Subtotal"]]
    for item, product_name in rows:
        data.append([
            product_name,
            str(item.quantity),
            f"₹{item.unit_price:.2f}",
            f"₹{item.subtotal:.2f}",
        ])
    data.append(["", "", "Total", f"₹{order.total_amount:.2f}"])
    table = Table(data, colWidths=[85 * mm, 20 * mm, 32 * mm, 32 * mm])
    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), "#eeeeee"),
            ("GRID", (0, 0), (-1, -1), 0.5, "#aaaaaa"),
            ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (-2, -1), (-1, -1), "Helvetica-Bold"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(table)
    story.extend([Spacer(1, 12), Paragraph("Thank you for shopping with Rebel Mart.", styles["BodyText"])])
    doc.build(story)


@celery_app.task(bind=True, base=ProgressTask, name="generate_order_invoice")
def generate_order_invoice(self: ProgressTask, order_id: int) -> dict:
    db = SessionLocal()
    try:
        self.progress(1, 4, "Loading order")
        order = db.scalar(select(Order).where(Order.id == order_id))
        if order is None:
            raise ValueError(f"Order {order_id} not found")

        self.progress(2, 4, "Loading invoice items")
        self.progress(3, 4, "Generating PDF")
        filename = f"invoice-{order_id}-{uuid4().hex[:12]}.pdf"
        output_path = INVOICE_DIR / filename
        _build_invoice_pdf(db, order, output_path)

        self.progress(4, 4, "Invoice ready")
        return {
            "type": "invoice",
            "order_id": order_id,
            "filename": filename,
            "download_url": f"/background/invoices/{filename}",
        }
    finally:
        db.close()


@celery_app.task(bind=True, base=ProgressTask, name="generate_all_order_invoices")
def generate_all_order_invoices(self: ProgressTask) -> dict:
    """Generate fresh PDFs for every order and package them into one ZIP file."""
    db = SessionLocal()
    try:
        orders = db.scalars(select(Order).order_by(Order.id)).all()
        total = len(orders)
        if not total:
            raise ValueError("No orders are available to package")

        zip_filename = f"rebelmart-all-order-invoices-{uuid4().hex[:12]}.zip"
        zip_path = INVOICE_DIR / zip_filename

        self.progress(0, total, f"Preparing {total} order invoices")

        generated_files: list[Path] = []
        try:
            for index, order in enumerate(orders, start=1):
                filename = f"invoice-{order.id}-{uuid4().hex[:12]}.pdf"
                output_path = INVOICE_DIR / filename
                _build_invoice_pdf(db, order, output_path)
                generated_files.append(output_path)
                self.progress(
                    index,
                    total,
                    f"Generated invoice {index} of {total}",
                )

            with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                for invoice_path in generated_files:
                    archive.write(invoice_path, arcname=invoice_path.name)

            return {
                "type": "bulk_invoice_zip",
                "total": total,
                "filename": zip_filename,
                "download_url": f"/background/invoices/bulk/{zip_filename}",
            }
        except Exception:
            zip_path.unlink(missing_ok=True)
            raise
    finally:
        db.close()


@celery_app.task(bind=True, base=ProgressTask, name="import_products_csv")
def import_products_csv(self: ProgressTask, csv_path: str) -> dict:
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError("CSV upload is no longer available to the worker")

    db = SessionLocal()
    imported = 0
    skipped = 0
    errors: list[str] = []
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))

        total = len(rows)
        self.progress(0, total or 1, f"Read {total} CSV rows")
        required = {"name", "price", "stock"}
        if rows and not required.issubset(rows[0].keys()):
            missing = sorted(required.difference(rows[0].keys()))
            raise ValueError(f"CSV is missing required columns: {', '.join(missing)}")

        for index, row in enumerate(rows, start=1):
            try:
                name = (row.get("name") or "").strip()
                if not name:
                    raise ValueError("name is empty")
                try:
                    price = Decimal(row.get("price", ""))
                except InvalidOperation as exc:
                    raise ValueError("price must be a valid number") from exc
                stock = int(row.get("stock", ""))
                if not price.is_finite() or price < 0 or stock < 0:
                    raise ValueError("price and stock must be non-negative finite values")
                db.add(
                    Product(
                        name=name,
                        description=(row.get("description") or "").strip() or None,
                        price=price,
                        stock=stock,
                        image_url=(row.get("image_url") or "").strip() or None,
                    )
                )
                imported += 1
                if imported % 100 == 0:
                    db.commit()
            except (TypeError, ValueError) as exc:
                db.rollback()
                skipped += 1
                errors.append(f"row {index}: {exc}")

            self.progress(index, total or 1, f"Imported {imported} of {total} rows")

        db.commit()
        clear_products_cache()
        return {
            "type": "csv_import",
            "total": total,
            "imported": imported,
            "skipped": skipped,
            "errors": errors[:20],
        }
    except Exception:
        db.rollback()
        logger.exception("CSV import failed: %s", path)
        raise
    finally:
        db.close()
        try:
            os.remove(path)
        except OSError:
            pass
