"""Add editable user profile data and profile image URL.

Revision ID: 20261001_profile
Revises: 20261001_compat
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "20261001_profile"
down_revision: Union[str, None] = "20261001_compat"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if "profile_image_url" not in {c["name"] for c in inspect(bind).get_columns("users")}:
        op.add_column("users", sa.Column("profile_image_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    if "profile_image_url" in {c["name"] for c in inspect(bind).get_columns("users")}:
        op.drop_column("users", "profile_image_url")
