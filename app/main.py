from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.users import router as user_router
from app.routers.products import router as product_router


# ==================================================
# FASTAPI APPLICATION
# ==================================================

app = FastAPI(
    title="Day 6 FastAPI Authentication API",
    description=(
        "FastAPI + Pydantic V2 + "
        "SQLAlchemy 2.0 + PostgreSQL + JWT Authentication"
    ),
    version="1.0.0"
)


# ==================================================
# CORS CONFIGURATION
# ==================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],

    allow_credentials=True,

    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allow_headers=[
        "Authorization",
        "Content-Type"
    ]
)


# ==================================================
# REGISTER ROUTERS
# ==================================================

app.include_router(user_router)
app.include_router(product_router)
app.include_router(auth_router)


# ==================================================
# HOME
# ==================================================

@app.get("/")
async def home():

    return {
        "message": "Day 6 FastAPI Authentication API is running",
        "docs": "/docs"
    }