from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal

from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserWithProducts
)

from app.crud.user import (
    create_user,
    get_users,
    get_user,
    update_user,
    delete_user
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ==================================================
# DATABASE DEPENDENCY
# ==================================================

async def get_db():

    async with AsyncSessionLocal() as session:

        yield session


# ==================================================
# CREATE USER
# ==================================================

@router.post(
    "",
    response_model=UserResponse,
    status_code=201
)
async def create_new_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):

    try:

        return await create_user(
            db,
            user
        )

    except ValueError as error:

        raise HTTPException(
            status_code=409,
            detail=str(error)
        )


# ==================================================
# GET ALL USERS
# ==================================================

@router.get(
    "",
    response_model=list[UserResponse]
)
async def read_users(
    db: AsyncSession = Depends(get_db)
):

    return await get_users(db)


# ==================================================
# GET USER + PRODUCTS
# ==================================================

@router.get(
    "/{user_id}",
    response_model=UserWithProducts
)
async def read_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):

    user = await get_user(
        db,
        user_id
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# ==================================================
# UPDATE USER
# ==================================================

@router.put(
    "/{user_id}",
    response_model=UserResponse
)
async def update_existing_user(
    user_id: int,
    user: UserUpdate,
    db: AsyncSession = Depends(get_db)
):

    try:

        updated_user = await update_user(
            db,
            user_id,
            user
        )

    except ValueError as error:

        raise HTTPException(
            status_code=409,
            detail=str(error)
        )

    if updated_user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return updated_user


# ==================================================
# DELETE USER
# ==================================================

@router.delete(
    "/{user_id}"
)
async def delete_existing_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):

    deleted_user = await delete_user(
        db,
        user_id
    )

    if deleted_user is None:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "message": "User deleted successfully",
        "user_id": user_id
    }