"""Add PostgreSQL full-text and fuzzy-search indexes.

Revision ID: 20261008_day18_search
Revises: 20261007_chat_messages
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20261008_day18_search"
down_revision: Union[str, None] = "20261007_chat_messages"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("products")}
    if "search_vector" not in columns:
        op.add_column(
            "products",
            sa.Column(
                "search_vector",
                postgresql.TSVECTOR(),
                sa.Computed(
                    "to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))",
                    persisted=True,
                ),
                nullable=True,
            ),
        )

    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_products_search_vector_gin "
        "ON products USING GIN (search_vector)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_products_name_trgm_gin "
        "ON products USING GIN (name gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_products_description_trgm_gin "
        "ON products USING GIN (description gin_trgm_ops)"
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    op.execute("DROP INDEX IF EXISTS ix_products_description_trgm_gin")
    op.execute("DROP INDEX IF EXISTS ix_products_name_trgm_gin")
    op.execute("DROP INDEX IF EXISTS ix_products_search_vector_gin")
    inspector = sa.inspect(bind)
    if "search_vector" in {column["name"] for column in inspector.get_columns("products")}:
        op.drop_column("products", "search_vector")
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
