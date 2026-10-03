import logging
import time
from pathlib import Path
from contextlib import asynccontextmanager
from uuid import uuid4

import redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi import status
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.config import settings
from app.database import Base, SessionLocal, engine
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
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


app = FastAPI(
    title=settings.APP_NAME,
    description="Production-oriented e-commerce backend built with FastAPI",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

settings.upload_dir_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.upload_dir_path.parent)), name="uploads")
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(websocket_router)


@app.middleware("http")
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
    if request.url.path.startswith("/uploads/"):
        response.headers.setdefault("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
    return response


@app.get("/", tags=["System"])
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


@app.get("/health", tags=["System"])
def health_check() -> dict:
    return {"status": "alive"}


@app.get("/health/ready", tags=["System"])
def readiness_check() -> dict:
    checks = _dependency_checks()
    ready = all(value == "up" for value in checks.values())
    if not ready:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"status": "not_ready", "checks": checks})
    return {"status": "ready", "checks": checks}
