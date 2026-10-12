"""Backfill columns introduced by the real-world schema hardening.

Revision ID: 20261001_compat
Revises: 20261001_initial
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "20261001_compat"
down_revision: Union[str, None] = "20261001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table: str, column: str) -> bool:
    return column in {c["name"] for c in inspect(op.get_bind()).get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    tables = set(inspect(bind).get_table_names())

    # Existing installations may have been created by the older project before
    # updated_at was added to the SQLAlchemy models. Add it safely without
    # destroying existing orders/products.
    if "orders" in tables and not _has_column("orders", "updated_at"):
        op.add_column(
            "orders",
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )
        bind.execute(sa.text("UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL"))
        op.alter_column("orders", "updated_at", nullable=False)

    if "products" in tables and not _has_column("products", "updated_at"):
        op.add_column(
            "products",
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )
        bind.execute(sa.text("UPDATE products SET updated_at = created_at WHERE updated_at IS NULL"))
        op.alter_column("products", "updated_at", nullable=False)


def downgrade() -> None:
    bind = op.get_bind()
    tables = set(inspect(bind).get_table_names())
    if "orders" in tables and _has_column("orders", "updated_at"):
        op.drop_column("orders", "updated_at")
    if "products" in tables and _has_column("products", "updated_at"):
        op.drop_column("products", "updated_at")
