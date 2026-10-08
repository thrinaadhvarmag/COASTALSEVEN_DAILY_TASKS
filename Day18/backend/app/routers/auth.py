from datetime import datetime, timedelta, timezone
from hashlib import sha256
import logging
from pathlib import Path
from secrets import randbelow
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
from app.schemas.auth import (
    LoginOTPRequiredResponse,
    LoginRequest,
    RegisterRequest,
    ResendLoginOTPRequest,
    TokenResponse,
    VerifyLoginOTPRequest,
)
from app.schemas.user import UserResponse, UserUpdate
from app.tasks.email_tasks import send_login_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger("ecommerce.auth")
security = HTTPBearer(auto_error=False)


def _hash_otp(otp: str) -> str:
    return sha256(f"{otp}:{settings.SECRET_KEY}".encode("utf-8")).hexdigest()


def _generate_otp() -> str:
    return f"{randbelow(1_000_000):06d}"


def _issue_login_otp(user: User, db: Session) -> str:
    now = datetime.now(timezone.utc)
    if user.email_otp_last_sent_at:
        elapsed = (now - user.email_otp_last_sent_at).total_seconds()
        if elapsed < settings.LOGIN_OTP_RESEND_SECONDS:
            remaining = max(1, int(settings.LOGIN_OTP_RESEND_SECONDS - elapsed))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting another OTP",
            )

    otp = _generate_otp()
    user.email_otp_hash = _hash_otp(otp)
    user.email_otp_expires_at = now + timedelta(minutes=settings.LOGIN_OTP_EXPIRE_MINUTES)
    user.email_otp_attempts = 0
    user.email_otp_last_sent_at = now
    db.commit()

    try:
        task = send_login_otp_email.delay(user.email, otp)
    except Exception:
        user.email_otp_hash = None
        user.email_otp_expires_at = None
        user.email_otp_last_sent_at = None
        user.email_otp_attempts = 0
        db.commit()
        logger.exception("Could not enqueue login OTP email for user_id=%s", user.id)
        raise HTTPException(status_code=503, detail="Could not send verification email. Please try again.")

    return task.id


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


@router.post("/login", response_model=LoginOTPRequiredResponse, status_code=status.HTTP_202_ACCEPTED)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> LoginOTPRequiredResponse:
    user = db.scalar(select(User).where(User.email == str(request.email).lower()))
    try:
        password_valid = user is not None and verify_password(request.password, user.hashed_password)
    except (ValueError, TypeError):
        password_valid = False

    if not password_valid or user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    task_id = _issue_login_otp(user, db)
    return LoginOTPRequiredResponse(
        message="A 6-digit verification code has been sent to your email",
        email=user.email,
        task_id=task_id,
    )


@router.post("/login/verify", response_model=TokenResponse)
def verify_login_otp(request: VerifyLoginOTPRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == str(request.email).lower()))
    if user is None or not user.email_otp_hash or not user.email_otp_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active verification code. Please request a new OTP.")

    now = datetime.now(timezone.utc)
    expires_at = user.email_otp_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now >= expires_at:
        user.email_otp_hash = None
        user.email_otp_expires_at = None
        user.email_otp_attempts = 0
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Please request a new OTP.")

    if user.email_otp_attempts >= settings.LOGIN_OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many incorrect OTP attempts. Please request a new OTP.")

    if _hash_otp(request.otp) != user.email_otp_hash:
        user.email_otp_attempts += 1
        if user.email_otp_attempts >= settings.LOGIN_OTP_MAX_ATTEMPTS:
            user.email_otp_hash = None
            user.email_otp_expires_at = None
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid verification code")

    user.email_verified = True
    user.email_otp_hash = None
    user.email_otp_expires_at = None
    user.email_otp_attempts = 0
    db.commit()
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login/resend", response_model=LoginOTPRequiredResponse, status_code=status.HTTP_202_ACCEPTED)
def resend_login_otp(request: ResendLoginOTPRequest, db: Session = Depends(get_db)) -> LoginOTPRequiredResponse:
    user = db.scalar(select(User).where(User.email == str(request.email).lower()))
    if user is None:
        return LoginOTPRequiredResponse(
            message="If an account exists for this email, a verification code will be sent",
            email=str(request.email).lower(),
            task_id=None,
        )
    task_id = _issue_login_otp(user, db)
    return LoginOTPRequiredResponse(message="A new verification code has been sent to your email", email=user.email, task_id=task_id)


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
        current_user.email_verified = False
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
