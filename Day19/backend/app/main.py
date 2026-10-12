import logging
import time
from pathlib import Path
from contextlib import asynccontextmanager
from uuid import uuid4

import redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi import status
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.rate_limit import limiter

from app.core.config import settings
from app.database import Base, SessionLocal, engine
from app.routers.auth import router as auth_router
from app.routers.background import router as background_router
from app.routers.cart import router as cart_router
from app.routers.chat import router as chat_router
from app.routers.orders import router as orders_router
from app.routers.products import router as products_router
from app.routers.websocket import router as websocket_router

logger = logging.getLogger("ecommerce")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Development convenience only. Production deployments should use Alembic migrations.
    if settings.ENVIRONMENT == "development":
        Base.metadata.create_all(bind=engine)
    yield


api_app = FastAPI(
    title=settings.APP_NAME,
    description="Production-oriented e-commerce backend built with FastAPI",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Keep `app` as the FastAPI instance so tests and integrations can access
# dependency_overrides, state, and router metadata.
app = api_app

# Rate limiting is backed by Redis DB 5 so it cannot evict application cache
# keys. The default limit protects every HTTP API endpoint; sensitive and
# resource-intensive routes apply stricter per-route limits.
app.state.limiter = limiter
api_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
api_app.add_middleware(SlowAPIMiddleware)

api_app.add_middleware(GZipMiddleware, minimum_size=1000)
api_app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts,
)

settings.upload_dir_path.mkdir(parents=True, exist_ok=True)
profile_upload_dir = settings.upload_dir_path.parent / "profiles"
profile_upload_dir.mkdir(parents=True, exist_ok=True)

# Only public image directories are mounted. Private artifacts such as invoices
# and import files remain outside StaticFiles and are served through
# authenticated endpoints. Mounting the whole uploads directory would expose
# those private files to anyone who can guess a filename.
api_app.mount("/uploads/products", StaticFiles(directory=str(settings.upload_dir_path)), name="product-uploads")
api_app.mount("/uploads/profiles", StaticFiles(directory=str(profile_upload_dir)), name="profile-uploads")
api_app.include_router(auth_router)
api_app.include_router(background_router)
api_app.include_router(products_router)
api_app.include_router(cart_router)
api_app.include_router(chat_router)
api_app.include_router(orders_router)
api_app.include_router(websocket_router)


@api_app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled error request_id=%s path=%s", request_id, request.url.path)
        response = JSONResponse(status_code=500, content={"detail": "Internal server error", "request_id": request_id})
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{time.perf_counter() - started:.4f}"

    # OWASP-oriented browser/API hardening. HSTS is enabled only outside local
    # development because it should only be sent when HTTPS is guaranteed.
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if settings.ENVIRONMENT in {"staging", "production"}:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    # Authentication and mutation responses should never be stored by an
    # intermediary cache. Public uploaded media keeps its explicit cache rule.
    if request.url.path.startswith("/auth/") or request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        response.headers.setdefault("Cache-Control", "no-store")
    if request.url.path.startswith("/uploads/"):
        response.headers.setdefault("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
    return response


@limiter.exempt
@api_app.get("/", tags=["System"])
def root() -> dict[str, str]:
    return {"message": settings.APP_NAME, "version": settings.APP_VERSION, "status": "success"}


def _dependency_checks() -> dict[str, str]:
    checks = {"database": "down", "redis": "down"}
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        checks["database"] = "up"
    except Exception:
        logger.exception("Database health check failed")
    try:
        client = redis.Redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        client.ping()
        client.close()
        checks["redis"] = "up"
    except Exception:
        logger.exception("Redis health check failed")
    return checks


@limiter.exempt
@api_app.get("/health", tags=["System"])
def health_check() -> dict:
    return {"status": "alive"}


@limiter.exempt
@api_app.get("/health/ready", tags=["System"])
def readiness_check() -> dict:
    checks = _dependency_checks()
    ready = all(value == "up" for value in checks.values())
    if not ready:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"status": "not_ready", "checks": checks})
    return {"status": "ready", "checks": checks}


# Wrap the completed application with CORS as the outermost ASGI middleware.
# This ensures browser clients receive CORS headers on successful responses and
# on errors produced by inner middleware (including rate-limit/error handling).
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

# Standard ASGI entry point; app remains the FastAPI instance.
app = api_app
