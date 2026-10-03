from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)) -> User:
    existing_user = db.scalar(select(User).where(or_(User.email == request.email, User.username == request.username)))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username or email already exists")

    user = User(
        username=request.username,
        email=str(request.email).lower(),
        hashed_password=hash_password(request.password),
        role="user",
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username or email already exists")
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == str(request.email).lower()))
    try:
        password_valid = user is not None and verify_password(request.password, user.hashed_password)
    except (ValueError, TypeError):
        password_valid = False

    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=create_access_token(user.id))


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id = decode_access_token(credentials.credentials)
    except (InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


ALLOWED_PROFILE_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
PROFILE_SIGNATURES = {"image/jpeg": b"\xff\xd8\xff", "image/png": b"\x89PNG\r\n\x1a\n", "image/webp": b"RIFF"}


@router.put("/me", response_model=UserResponse)
def update_me(request: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> User:
    username = request.username.strip() if request.username is not None else None
    email = str(request.email).lower() if request.email is not None else None
    if username is not None:
        if len(username) < 2 or len(username) > 50:
            raise HTTPException(status_code=422, detail="Username must be between 2 and 50 characters")
        duplicate = db.scalar(select(User).where(User.username == username, User.id != current_user.id))
        if duplicate:
            raise HTTPException(status_code=409, detail="Username already exists")
        current_user.username = username
    if email is not None:
        duplicate = db.scalar(select(User).where(User.email == email, User.id != current_user.id))
        if duplicate:
            raise HTTPException(status_code=409, detail="Email already exists")
        current_user.email = email
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username or email already exists")
    db.refresh(current_user)
    return current_user


@router.post("/me/profile-picture", response_model=UserResponse)
def upload_profile_picture(image: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> User:
    if image.content_type not in ALLOWED_PROFILE_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WEBP images are allowed")
    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    header = image.file.read(32)
    signature = PROFILE_SIGNATURES[image.content_type]
    if not header.startswith(signature):
        raise HTTPException(status_code=400, detail="Invalid image file")
    if image.content_type == "image/webp" and b"WEBP" not in header:
        raise HTTPException(status_code=400, detail="Invalid WEBP image")
    image.file.seek(0)
    profile_dir = settings.upload_dir_path.parent / "profiles"
    profile_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4()}{ALLOWED_PROFILE_IMAGE_TYPES[image.content_type]}"
    path = profile_dir / filename
    total = 0
    with path.open("wb") as buffer:
        while chunk := image.file.read(1024 * 1024):
            total += len(chunk)
            if total > max_bytes:
                path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail=f"Image must be <= {settings.MAX_IMAGE_SIZE_MB} MB")
            buffer.write(chunk)
    current_user.profile_image_url = f"/uploads/profiles/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me/profile-picture", response_model=UserResponse)
def delete_profile_picture(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> User:
    current_user.profile_image_url = None
    db.commit()
    db.refresh(current_user)
    return current_user
