from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import require_role
from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from app.services.cache_service import (
    clear_all_product_cache,
    clear_products_cache,
    delete_product_cache,
    get_product_cache,
    get_products_cache,
    set_product_cache,
    set_products_cache,
)


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


UPLOAD_DIR = Path("uploads/products")

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
) -> Product:

    product = Product(
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        stock=product_data.stock,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    # Product list has changed.
    clear_products_cache()

    return product


@router.get(
    "",
    response_model=list[ProductResponse],
)
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Product]:

    # 1. Check Redis first.
    cached_products = get_products_cache()

    if cached_products is not None:
        print("PRODUCT CACHE HIT")

        return cached_products

    # 2. Redis MISS → query PostgreSQL.
    print("PRODUCT CACHE MISS")

    products = db.scalars(
        select(Product).order_by(Product.id.desc())
    ).all()

    products_list = list(products)

    # 3. Convert SQLAlchemy models into JSON-compatible data.
    products_data = [
        ProductResponse.model_validate(
            product
        ).model_dump(mode="json")
        for product in products_list
    ]

    # 4. Store result in Redis.
    set_products_cache(
        products_data
    )

    return products_list


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Product:

    # 1. Check individual product cache.
    cached_product = get_product_cache(
        product_id
    )

    if cached_product is not None:
        print("PRODUCT CACHE HIT")

        return cached_product

    # 2. Redis MISS → query PostgreSQL.
    print("PRODUCT CACHE MISS")

    product = db.get(
        Product,
        product_id,
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # 3. Convert product into JSON-compatible data.
    product_data = (
        ProductResponse.model_validate(
            product
        ).model_dump(mode="json")
    )

    # 4. Store product in Redis.
    set_product_cache(
        product_id,
        product_data,
    )

    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
) -> Product:

    product = db.get(
        Product,
        product_id,
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    update_data = product_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            product,
            field,
            value,
        )

    db.commit()
    db.refresh(product)

    # Invalidate both caches.
    delete_product_cache(
        product_id
    )

    clear_products_cache()

    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
) -> None:

    product = db.get(
        Product,
        product_id,
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    db.delete(product)
    db.commit()

    # Invalidate both caches.
    delete_product_cache(
        product_id
    )

    clear_products_cache()


@router.post(
    "/{product_id}/image",
    response_model=ProductResponse,
)
def upload_product_image(
    product_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
) -> Product:

    product = db.get(
        Product,
        product_id,
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only JPEG, PNG, and WEBP "
                "images are allowed"
            ),
        )

    extension = Path(
        image.filename or ""
    ).suffix.lower()

    if not extension:
        extension = ".jpg"

    filename = (
        f"{uuid4()}{extension}"
    )

    file_path = (
        UPLOAD_DIR / filename
    )

    with file_path.open("wb") as buffer:
        while chunk := image.file.read(
            1024 * 1024
        ):
            buffer.write(chunk)

    product.image_url = (
        f"/uploads/products/{filename}"
    )

    db.commit()
    db.refresh(product)

    # Image changed, so cached product is outdated.
    delete_product_cache(
        product_id
    )

    clear_products_cache()

    return product