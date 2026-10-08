from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "E-Commerce Backend API"
    APP_VERSION: str = "2.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    DATABASE_URL: str
    TEST_DATABASE_URL: str | None = None

    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, gt=0, le=1440)

    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_USE_TLS: bool = True
    LOGIN_OTP_EXPIRE_MINUTES: int = Field(default=5, ge=1, le=30)
    LOGIN_OTP_RESEND_SECONDS: int = Field(default=60, ge=15, le=300)
    LOGIN_OTP_MAX_ATTEMPTS: int = Field(default=5, ge=3, le=10)

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    UPLOAD_DIR: str = "uploads/products"
    MAX_IMAGE_SIZE_MB: int = Field(default=5, ge=1, le=20)
    PRODUCT_CACHE_SECONDS: int = Field(default=300, ge=30, le=3600)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    @property
    def upload_dir_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        if not path.is_absolute():
            path = Path(__file__).resolve().parents[2] / path
        return path.resolve()

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.CORS_ORIGINS.split(",") if item.strip()]

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, value: str) -> str:
        allowed = {"development", "testing", "staging", "production"}
        if value not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of: {sorted(allowed)}")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
