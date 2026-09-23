from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal

from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse
)

from app.crud.product import (
    create_product,
    get_products,
    get_product,
    update_product,
    delete_product
)

from app.crud.user import get_user

from app.core.security import (
    get_current_user,
    require_admin
)


# ==================================================
# ROUTER
# ==================================================

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# ==================================================
# DATABASE DEPENDENCY
# ==================================================

async def get_db():

    async with AsyncSessionLocal() as session:

        yield session


# ==================================================
# CREATE PRODUCT
# ADMIN ONLY
# ==================================================

@router.post(
    "",
    response_model=ProductResponse,
    status_code=201
)
async def create_new_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
):

    # Check whether user exists
    user = await get_user(
        db,
        product.user_id
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return await create_product(
        db,
        product
    )


# ==================================================
# GET ALL PRODUCTS
# AUTHENTICATED USERS
# ==================================================

@router.get(
    "",
    response_model=list[ProductResponse]
)
async def read_products(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return await get_products(db)


# ==================================================
# GET PRODUCT BY ID
# AUTHENTICATED USERS
# ==================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
async def read_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):

    product = await get_product(
        db,
        product_id
    )

    if product is None:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# ==================================================
# UPDATE PRODUCT
# ADMIN ONLY
# ==================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
async def update_existing_product(
    product_id: int,
    product: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
):

    updated_product = await update_product(
        db,
        product_id,
        product
    )

    if updated_product is None:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return updated_product


# ==================================================
# DELETE PRODUCT
# ADMIN ONLY
# ==================================================

@router.delete(
    "/{product_id}"
)
async def delete_existing_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
):

    deleted_product = await delete_product(
        db,
        product_id
    )

    if deleted_product is None:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "message": "Product deleted successfully",
        "product_id": product_id
    }