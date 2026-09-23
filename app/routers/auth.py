from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.user import User

from app.schemas.auth import (
    RegisterRequest,
    RefreshRequest
)

from app.crud.user import create_user

from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    require_admin
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

async def get_db():

    async with AsyncSessionLocal() as session:

        yield session


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    status_code=201
)
async def register(
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):

    try:

        user = await create_user(
            db,
            user_data
        )

        return {
            "message": "User registered successfully",
            "user_id": user.id
        }

    except ValueError as error:

        raise HTTPException(
            status_code=409,
            detail=str(error)
        )


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(User).where(
            User.email == form_data.username
        )
    )

    user = result.scalar_one_or_none()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        user.hashed_password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    access_token = create_access_token(
        user.id
    )

    refresh_token = create_refresh_token(
        user.id
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


# ============================================================
# REFRESH ACCESS TOKEN
# ============================================================

@router.post("/refresh")
async def refresh_access_token(
    request: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):

    try:

        payload = decode_token(
            request.refresh_token
        )

        user_id = payload.get("sub")

        token_type = payload.get("type")

        if user_id is None:

            raise ValueError(
                "Invalid refresh token"
            )

        if token_type != "refresh":

            raise ValueError(
                "Refresh token required"
            )

        user_id = int(user_id)

    except (ValueError, TypeError):

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
        )

    # --------------------------------------------------------
    # Check whether user still exists
    # --------------------------------------------------------

    result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    user = result.scalar_one_or_none()

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    # --------------------------------------------------------
    # Check whether user is active
    # --------------------------------------------------------

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    # --------------------------------------------------------
    # Create new access token
    # --------------------------------------------------------

    new_access_token = create_access_token(
        user.id
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
async def get_me(
    current_user: User = Depends(
        get_current_user
    )
):

    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active
    }


# ============================================================
# ADMIN TEST
# ============================================================

@router.get("/admin-test")
async def admin_test(
    current_user: User = Depends(
        require_admin
    )
):

    return {
        "message": "Welcome Admin",
        "user_id": current_user.id,
        "role": current_user.role
    }