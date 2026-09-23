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
# ==================================================

@router.post(
    "",
    response_model=ProductResponse,
    status_code=201
)
async def create_new_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db)
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
# ==================================================

@router.get(
    "",
    response_model=list[ProductResponse]
)
async def read_products(
    db: AsyncSession = Depends(get_db)
):

    return await get_products(db)


# ==================================================
# GET PRODUCT BY ID
# ==================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
async def read_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
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
# ==================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
async def update_existing_product(
    product_id: int,
    product: ProductUpdate,
    db: AsyncSession = Depends(get_db)
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
# ==================================================

@router.delete(
    "/{product_id}"
)
async def delete_existing_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
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