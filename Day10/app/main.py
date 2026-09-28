from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.orders import router as orders_router
from app.routers.products import router as products_router
from app.routers.websocket import router as websocket_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="E-Commerce Backend API",
    description="Production-grade e-commerce backend built with FastAPI",
    version="1.0.0",
)


app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(websocket_router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "E-Commerce Backend API is running",
        "status": "success",
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
    }