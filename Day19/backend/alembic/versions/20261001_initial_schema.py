"""Create e-commerce schema.

Revision ID: 20261001_initial
Revises:
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "20261001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    if "users" not in tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("username", sa.String(length=50), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("hashed_password", sa.String(length=255), nullable=False),
            sa.Column("role", sa.String(length=20), nullable=False, server_default="user"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.UniqueConstraint("username"),
            sa.UniqueConstraint("email"),
        )
        op.create_index("ix_users_id", "users", ["id"])
        op.create_index("ix_users_username", "users", ["username"])
        op.create_index("ix_users_email", "users", ["email"])
        op.create_index("ix_users_role", "users", ["role"])

    if "products" not in tables:
        op.create_table(
            "products",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=150), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("price", sa.Numeric(12, 2), nullable=False),
            sa.Column("stock", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("image_url", sa.String(length=500), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index("ix_products_id", "products", ["id"])
        op.create_index("ix_products_name", "products", ["name"])
    else:
        cols = {c["name"]: c for c in inspect(bind).get_columns("products")}
        if "price" in cols and (not isinstance(cols["price"]["type"], sa.Numeric) or isinstance(cols["price"]["type"], sa.Float)):
            with op.batch_alter_table("products") as batch:
                batch.alter_column(
                    "price",
                    existing_type=cols["price"]["type"],
                    type_=sa.Numeric(12, 2),
                )

    if "orders" not in tables:
        op.create_table(
            "orders",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="PLACED"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index("ix_orders_id", "orders", ["id"])
        op.create_index("ix_orders_user_id", "orders", ["user_id"])
        op.create_index("ix_orders_status", "orders", ["status"])
        op.create_index("ix_orders_created_at", "orders", ["created_at"])
    else:
        cols = {c["name"]: c for c in inspect(bind).get_columns("orders")}
        if "total_amount" in cols and (not isinstance(cols["total_amount"]["type"], sa.Numeric) or isinstance(cols["total_amount"]["type"], sa.Float)):
            with op.batch_alter_table("orders") as batch:
                batch.alter_column(
                    "total_amount",
                    existing_type=cols["total_amount"]["type"],
                    type_=sa.Numeric(12, 2),
                )

    if "order_items" not in tables:
        op.create_table(
            "order_items",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
            sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        )
        op.create_index("ix_order_items_id", "order_items", ["id"])
        op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
        op.create_index("ix_order_items_product_id", "order_items", ["product_id"])
    else:
        cols = {c["name"]: c for c in inspect(bind).get_columns("order_items")}
        for name in ("unit_price", "subtotal"):
            if name in cols and (not isinstance(cols[name]["type"], sa.Numeric) or isinstance(cols[name]["type"], sa.Float)):
                with op.batch_alter_table("order_items") as batch:
                    batch.alter_column(
                        name,
                        existing_type=cols[name]["type"],
                        type_=sa.Numeric(12, 2),
                    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    for table in ("order_items", "orders", "products", "users"):
        if table in inspector.get_table_names():
            op.drop_table(table)
