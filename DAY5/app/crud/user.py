from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserUpdate
)


# ==================================================
# CREATE USER
# ==================================================

async def create_user(
    db: AsyncSession,
    user_data: UserCreate
):

    user = User(
        name=user_data.name,
        email=user_data.email
    )

    db.add(user)

    try:

        await db.commit()

    except IntegrityError:

        await db.rollback()

        raise ValueError(
            "Email already exists"
        )

    await db.refresh(user)

    return user


# ==================================================
# GET ALL USERS
# ==================================================

async def get_users(
    db: AsyncSession
):

    result = await db.execute(
        select(User)
    )

    return result.scalars().all()


# ==================================================
# GET USER BY ID WITH PRODUCTS
# ==================================================

async def get_user(
    db: AsyncSession,
    user_id: int
):

    result = await db.execute(
        select(User)
        .options(
            selectinload(User.products)
        )
        .where(
            User.id == user_id
        )
    )

    return result.scalar_one_or_none()


# ==================================================
# UPDATE USER
# ==================================================

async def update_user(
    db: AsyncSession,
    user_id: int,
    user_data: UserUpdate
):

    user = await get_user(
        db,
        user_id
    )

    if user is None:
        return None

    update_data = user_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():

        setattr(
            user,
            key,
            value
        )

    try:

        await db.commit()

    except IntegrityError:

        await db.rollback()

        raise ValueError(
            "Email already exists"
        )

    await db.refresh(user)

    return user


# ==================================================
# DELETE USER
# ==================================================

async def delete_user(
    db: AsyncSession,
    user_id: int
):

    user = await get_user(
        db,
        user_id
    )

    if user is None:
        return None

    await db.delete(user)

    await db.commit()

    return user