from fastapi import FastAPI

from app.routers.users import router as user_router
from app.routers.products import router as product_router


# ==================================================
# FASTAPI APPLICATION
# ==================================================

app = FastAPI(
    title="Day 5 FastAPI CRUD API",
    description=(
        "FastAPI + Pydantic V2 + "
        "SQLAlchemy 2.0 + PostgreSQL"
    ),
    version="1.0.0"
)


# ==================================================
# REGISTER ROUTERS
# ==================================================

app.include_router(user_router)
app.include_router(product_router)


# ==================================================
# HOME
# ==================================================

@app.get("/")
async def home():

    return {
        "message": "Day 5 FastAPI CRUD API is running",
        "docs": "/docs"
    }