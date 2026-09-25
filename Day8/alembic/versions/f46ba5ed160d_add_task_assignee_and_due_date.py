"""add task assignee and due date

Revision ID: f46ba5ed160d
Revises: 5c5e8c052509
Create Date: 2026-09-24 15:13:38.157843
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f46ba5ed160d"
down_revision: Union[str, Sequence[str], None] = "5c5e8c052509"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add due date to tasks.
    op.add_column(
        "tasks",
        sa.Column("due_date", sa.DateTime(), nullable=True)
    )

    # Add optional task assignee.
    op.add_column(
        "tasks",
        sa.Column("assignee_id", sa.Integer(), nullable=True)
    )

    # Make project mandatory for every task.
    op.alter_column(
        "tasks",
        "project_id",
        existing_type=sa.Integer(),
        nullable=False
    )

    # Connect assignee_id with users.id.
    op.create_foreign_key(
        "fk_tasks_assignee_id_users",
        "tasks",
        "users",
        ["assignee_id"],
        ["id"]
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_tasks_assignee_id_users",
        "tasks",
        type_="foreignkey"
    )

    op.alter_column(
        "tasks",
        "project_id",
        existing_type=sa.Integer(),
        nullable=True
    )

    op.drop_column("tasks", "assignee_id")
    op.drop_column("tasks", "due_date")