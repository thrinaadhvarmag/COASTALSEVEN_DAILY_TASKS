"""Add login email OTP fields.

Revision ID: 20261008_login_otp
Revises: 20261008_day18_search
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20261008_login_otp"
down_revision: Union[str, None] = "20261008_day18_search"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("email_otp_hash", sa.String(length=128), nullable=True))
    op.add_column("users", sa.Column("email_otp_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("email_otp_attempts", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("email_otp_last_sent_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_users_email_verified", "users", ["email_verified"], unique=False)
    op.alter_column("users", "email_verified", server_default=None)
    op.alter_column("users", "email_otp_attempts", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_users_email_verified", table_name="users")
    op.drop_column("users", "email_otp_last_sent_at")
    op.drop_column("users", "email_otp_attempts")
    op.drop_column("users", "email_otp_expires_at")
    op.drop_column("users", "email_otp_hash")
    op.drop_column("users", "email_verified")
