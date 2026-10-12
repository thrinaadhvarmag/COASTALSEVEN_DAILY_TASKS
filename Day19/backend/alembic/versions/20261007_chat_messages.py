"""add persistent chat messages

Revision ID: 20261007_chat_messages
Revises: 20261001_order_delivery
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20261007_chat_messages"
down_revision = "20261001_order_delivery"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The development app may have created this table before Alembic was
    # synchronized. Make the migration safe for that existing installation.
    bind = op.get_bind()
    inspector = inspect(bind)
    if "chat_messages" in inspector.get_table_names():
        return

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("sender_role", sa.String(length=20), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_chat_messages_id", "chat_messages", ["id"])
    op.create_index("ix_chat_messages_customer_id", "chat_messages", ["customer_id"])
    op.create_index("ix_chat_messages_sender_id", "chat_messages", ["sender_id"])
    op.create_index("ix_chat_messages_created_at", "chat_messages", ["created_at"])


def downgrade() -> None:
    bind = op.get_bind()
    if "chat_messages" not in inspect(bind).get_table_names():
        return
    op.drop_index("ix_chat_messages_created_at", table_name="chat_messages")
    op.drop_index("ix_chat_messages_sender_id", table_name="chat_messages")
    op.drop_index("ix_chat_messages_customer_id", table_name="chat_messages")
    op.drop_index("ix_chat_messages_id", table_name="chat_messages")
    op.drop_table("chat_messages")
