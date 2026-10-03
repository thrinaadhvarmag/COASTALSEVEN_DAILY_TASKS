"""Add delivery details snapshot to orders."""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "20261001_order_delivery"
down_revision: Union[str, None] = "20261001_profile"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMNS = {
    "customer_name": sa.String(120),
    "phone": sa.String(30),
    "address": sa.String(500),
    "city": sa.String(100),
    "state": sa.String(100),
    "pincode": sa.String(10),
    "delivery_instructions": sa.String(500),
}

def upgrade() -> None:
    inspector = inspect(op.get_bind())
    existing = {c["name"] for c in inspector.get_columns("orders")}
    for name, typ in COLUMNS.items():
        if name not in existing:
            op.add_column("orders", sa.Column(name, typ, nullable=True))

def downgrade() -> None:
    inspector = inspect(op.get_bind())
    existing = {c["name"] for c in inspector.get_columns("orders")}
    for name in reversed(list(COLUMNS)):
        if name in existing:
            op.drop_column("orders", name)
