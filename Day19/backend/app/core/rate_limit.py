"""Shared SlowAPI limiter instance.

Keeping the limiter in core avoids circular imports between main.py and routers.
The FastAPI application registers the instance and exception handler.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.RATE_LIMIT_REDIS_URL,
    default_limits=[settings.RATE_LIMIT_DEFAULT],
    headers_enabled=True,
    enabled=settings.ENVIRONMENT not in {"testing", "test"},
)
