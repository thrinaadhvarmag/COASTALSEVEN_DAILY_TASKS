import os

from dotenv import load_dotenv

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)

from sqlalchemy.orm import DeclarativeBase


# ==================================================
# LOAD ENVIRONMENT VARIABLES
# ==================================================

load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")


if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set in .env"
    )


# ==================================================
# ASYNC DATABASE ENGINE
# ==================================================

engine = create_async_engine(
    DATABASE_URL,
    echo=True
)


# ==================================================
# ASYNC SESSION FACTORY
# ==================================================

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)


# ==================================================
# SQLALCHEMY BASE
# ==================================================

class Base(DeclarativeBase):
    pass