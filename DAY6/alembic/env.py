import os
import asyncio

from logging.config import fileConfig

from dotenv import load_dotenv

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from app.database import Base

# Import models so Alembic detects them
from app.models.user import User
from app.models.product import Product


# ==================================================
# ALEMBIC CONFIGURATION
# ==================================================

config = context.config


# ==================================================
# LOAD ENVIRONMENT VARIABLES
# ==================================================

load_dotenv()


DATABASE_URL = os.getenv(
    "DATABASE_URL"
)


if not DATABASE_URL:

    raise RuntimeError(
        "DATABASE_URL is not set in .env"
    )


config.set_main_option(
    "sqlalchemy.url",
    DATABASE_URL
)


# ==================================================
# LOGGING
# ==================================================

if config.config_file_name is not None:

    fileConfig(
        config.config_file_name
    )


# ==================================================
# METADATA
# ==================================================

target_metadata = Base.metadata


# ==================================================
# OFFLINE MIGRATION
# ==================================================

def run_migrations_offline():

    url = config.get_main_option(
        "sqlalchemy.url"
    )

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        }
    )

    with context.begin_transaction():

        context.run_migrations()


# ==================================================
# MIGRATION FUNCTION
# ==================================================

def do_run_migrations(
    connection: Connection
):

    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True
    )

    with context.begin_transaction():

        context.run_migrations()


# ==================================================
# ASYNC MIGRATION
# ==================================================

async def run_async_migrations():

    connectable = async_engine_from_config(
        config.get_section(
            config.config_ini_section,
            {}
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool
    )

    async with connectable.connect() as connection:

        await connection.run_sync(
            do_run_migrations
        )

    await connectable.dispose()


# ==================================================
# ONLINE MIGRATION
# ==================================================

def run_migrations_online():

    asyncio.run(
        run_async_migrations()
    )


# ==================================================
# START MIGRATION
# ==================================================

if context.is_offline_mode():

    run_migrations_offline()

else:

    run_migrations_online()