import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.models.user import User
from api.schemas.auth import (
    UserCreate,
    UserUpdate,
    UserResponse,
    LoginRequest,
    Token,
)
from api.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_admin,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

PROFILE_UPLOAD_DIR = Path("uploads") / "profiles"
PROFILE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024


def delete_profile_image_file(image_url: str | None) -> None:
    if not image_url:
        return

    filename = Path(image_url).name
    file_path = PROFILE_UPLOAD_DIR / filename

    try:
        if file_path.exists():
            file_path.unlink()
    except OSError:
        pass


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_username = (
        db.query(User)
        .filter(User.username == user_data.username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    existing_email = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    hashed_password = hash_password(user_data.password)

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role="user"
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post(
    "/login",
    response_model=Token
)
def login_user(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == login_data.email)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.put(
    "/me",
    response_model=UserResponse
)
def update_me(
    profile_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    username_conflict = (
        db.query(User)
        .filter(
            User.username == profile_data.username,
            User.id != current_user.id,
        )
        .first()
    )

    if username_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    email_conflict = (
        db.query(User)
        .filter(
            User.email == profile_data.email,
            User.id != current_user.id,
        )
        .first()
    )

    if email_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists"
        )

    current_user.username = profile_data.username
    current_user.email = profile_data.email

    db.commit()
    db.refresh(current_user)

    return current_user


@router.post(
    "/me/profile-picture",
    response_model=UserResponse,
)
def upload_profile_picture(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    extension = ALLOWED_IMAGE_TYPES.get(image.content_type)

    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, and WEBP images are allowed."
        )

    contents = image.file.read(MAX_PROFILE_IMAGE_SIZE + 1)

    if len(contents) > MAX_PROFILE_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Profile image must be 5 MB or smaller."
        )

    old_image_url = current_user.profile_image_url
    filename = f"{uuid4().hex}{extension}"
    destination = PROFILE_UPLOAD_DIR / filename

    try:
        with destination.open("wb") as output_file:
            output_file.write(contents)
    except OSError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save profile image."
        ) from error

    current_user.profile_image_url = f"/uploads/profiles/{filename}"

    try:
        db.commit()
        db.refresh(current_user)
    except Exception:
        db.rollback()
        try:
            destination.unlink(missing_ok=True)
        except OSError:
            pass
        raise

    delete_profile_image_file(old_image_url)

    return current_user


@router.delete(
    "/me/profile-picture",
    response_model=UserResponse,
)
def delete_profile_picture(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    old_image_url = current_user.profile_image_url

    current_user.profile_image_url = None
    db.commit()
    db.refresh(current_user)

    delete_profile_image_file(old_image_url)

    return current_user


@router.get("/admin-only")
def admin_only(
    current_user: User = Depends(require_admin)
):
    return {
        "message": "Welcome Admin",
        "user_id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }


@router.get(
    "/users",
    response_model=list[UserResponse]
)
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    users = (
        db.query(User)
        .order_by(User.id)
        .all()
    )

    return users
