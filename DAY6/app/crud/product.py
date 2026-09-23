from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product

from app.schemas.product import (
    ProductCreate,
    ProductUpdate
)


# ==================================================
# CREATE PRODUCT
# ==================================================

async def create_product(
    db: AsyncSession,
    product_data: ProductCreate
):

    product = Product(
        name=product_data.name,
        price=product_data.price,
        user_id=product_data.user_id
    )

    db.add(product)

    await db.commit()

    await db.refresh(product)

    return product


# ==================================================
# GET ALL PRODUCTS
# ==================================================

async def get_products(
    db: AsyncSession
):

    result = await db.execute(
        select(Product)
    )

    return result.scalars().all()


# ==================================================
# GET PRODUCT BY ID
# ==================================================

async def get_product(
    db: AsyncSession,
    product_id: int
):

    result = await db.execute(
        select(Product)
        .where(
            Product.id == product_id
        )
    )

    return result.scalar_one_or_none()


# ==================================================
# UPDATE PRODUCT
# ==================================================

async def update_product(
    db: AsyncSession,
    product_id: int,
    product_data: ProductUpdate
):

    product = await get_product(
        db,
        product_id
    )

    if product is None:
        return None

    update_data = product_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():

        setattr(
            product,
            key,
            value
        )

    await db.commit()

    await db.refresh(product)

    return product


# ==================================================
# DELETE PRODUCT
# ==================================================

async def delete_product(
    db: AsyncSession,
    product_id: int
):

    product = await get_product(
        db,
        product_id
    )

    if product is None:
        return None

    await db.delete(product)

    await db.commit()

    return product