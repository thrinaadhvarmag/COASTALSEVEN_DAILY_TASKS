from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import func, literal_column, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.permissions import require_role
from app.database import get_db
from app.models.product import Product
from app.models.order import OrderItem
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.cache_service import clear_products_cache, delete_product_cache, get_product_cache, get_products_cache, set_product_cache, set_products_cache

router = APIRouter(prefix="/products", tags=["Products"])


def _search_products(stmt, search: str | None, *, fuzzy: bool = True):
    """Apply PostgreSQL full-text + fuzzy search, with a portable fallback.

    PostgreSQL uses the generated tsvector column and GIN/trigram indexes created
    by the Day 18 migration. SQLite/test databases fall back to ILIKE.
    """
    if not search:
        return stmt

    term = search.strip()
    if not term:
        return stmt

    # The PostgreSQL expressions are safe to use only against PostgreSQL. The
    # endpoint checks the actual engine dialect before calling this helper.
    fts = literal_column("search_vector").op("@@")(
        func.websearch_to_tsquery("simple", term)
    )
    if fuzzy:
        similarity = func.greatest(
            func.similarity(Product.name, term),
            func.similarity(func.coalesce(Product.description, ""), term),
        )
        return stmt.where((fts) | (similarity >= 0.18)).order_by(
            func.greatest(
                func.ts_rank_cd(literal_column("search_vector"), func.websearch_to_tsquery("simple", term)),
                similarity,
            ).desc(),
            Product.id.desc(),
        )
    return stmt.where(fts).order_by(
        func.ts_rank_cd(literal_column("search_vector"), func.websearch_to_tsquery("simple", term)).desc(),
        Product.id.desc(),
    )


def _apply_search(stmt, search: str | None, db: Session):
    if not search:
        return stmt
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        return _search_products(stmt, search)
    return stmt.where(Product.name.ilike(f"%{search.strip()}%"))
UPLOAD_DIR = settings.upload_dir_path
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
IMAGE_SIGNATURES = {"image/jpeg": (b"\xff\xd8\xff",), "image/png": (b"\x89PNG\r\n\x1a\n",), "image/webp": (b"RIFF",)}


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))) -> Product:
    product = Product(**product_data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    clear_products_cache()
    return product


@router.get("", response_model=list[ProductResponse])
def get_products(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(default=1, ge=1, le=10000),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, min_length=1, max_length=100),
) -> list[Product]:
    response.headers["Cache-Control"] = "private, max-age=15, stale-while-revalidate=30"

    # Keep the original Redis fast path for the default catalog request.
    if page == 1 and page_size == 20 and not search:
        cached = get_products_cache()
        if cached is not None:
            return cached

    stmt = select(Product)
    stmt = _apply_search(stmt, search, db)
    if not search or db.bind is None or db.bind.dialect.name != "postgresql":
        stmt = stmt.order_by(Product.id.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    products = list(db.scalars(stmt).all())
    if page == 1 and page_size == 20 and not search:
        set_products_cache([ProductResponse.model_validate(p).model_dump(mode="json") for p in products])
    return products


@router.get("/count")
def get_product_count(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str | None = Query(default=None, min_length=1, max_length=100),
) -> dict[str, int]:
    """Return the total number of products matching the optional search term.

    This small metadata endpoint lets the React catalog render real page-number
    navigation while the normal /products endpoint remains backward compatible.
    """
    stmt = select(func.count(Product.id))
    if search:
        if db.bind is not None and db.bind.dialect.name == "postgresql":
            term = search.strip()
            fts = literal_column("search_vector").op("@@")(
        func.websearch_to_tsquery("simple", term)
    )
            similarity = func.greatest(
                func.similarity(Product.name, term),
                func.similarity(func.coalesce(Product.description, ""), term),
            )
            stmt = stmt.where((fts) | (similarity >= 0.18))
        else:
            stmt = stmt.where(Product.name.ilike(f"%{search.strip()}%"))
    total = int(db.scalar(stmt) or 0)
    response.headers["Cache-Control"] = "private, max-age=30, stale-while-revalidate=60"
    return {"total": total}


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Product:
    cached = get_product_cache(product_id)
    if cached is not None:
        return cached
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    set_product_cache(product_id, ProductResponse.model_validate(product).model_dump(mode="json"))
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_data: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    for field, value in product_data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    delete_product_cache(product_id)
    clear_products_cache()
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    referenced = db.scalar(select(OrderItem.id).where(OrderItem.product_id == product_id).limit(1))
    if referenced is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product cannot be deleted because it is referenced by an order",
        )
    db.delete(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product cannot be deleted because it is referenced by an order",
        )
    delete_product_cache(product_id)
    clear_products_cache()


@router.post("/{product_id}/image", response_model=ProductResponse)
def upload_product_image(product_id: int, image: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only JPEG, PNG, and WEBP images are allowed")

    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    header = image.file.read(32)
    if image.content_type == "image/webp" and not (header.startswith(b"RIFF") and b"WEBP" in header):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid WEBP image")
    if image.content_type != "image/webp" and not any(header.startswith(sig) for sig in IMAGE_SIGNATURES[image.content_type]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image file")
    image.file.seek(0)

    extension = ALLOWED_IMAGE_TYPES[image.content_type]
    filename = f"{uuid4()}{extension}"
    file_path = UPLOAD_DIR / filename
    total = 0
    with file_path.open("wb") as buffer:
        while chunk := image.file.read(1024 * 1024):
            total += len(chunk)
            if total > max_bytes:
                file_path.unlink(missing_ok=True)
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"Image must be <= {settings.MAX_IMAGE_SIZE_MB} MB")
            buffer.write(chunk)

    product.image_url = f"/uploads/products/{filename}"
    db.commit()
    db.refresh(product)
    delete_product_cache(product_id)
    clear_products_cache()
    return product
