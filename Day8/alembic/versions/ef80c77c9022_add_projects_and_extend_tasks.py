"""add projects and extend tasks

Revision ID: ef80c77c9022
Revises:
Create Date: 2026-09-24 11:01:20.508032

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "ef80c77c9022"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""

    # Create the projects table
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id")
    )

    # Add project_id to the existing tasks table.
    # Nullable=True allows existing tasks to remain valid.
    op.add_column(
        "tasks",
        sa.Column(
            "project_id",
            sa.Integer(),
            nullable=True
        )
    )

    # Add updated_at to the existing tasks table.
    # Existing rows receive the current timestamp.
    op.add_column(
        "tasks",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False
        )
    )

    # Create relationship between tasks and projects.
    op.create_foreign_key(
        "fk_tasks_project_id",
        "tasks",
        "projects",
        ["project_id"],
        ["id"]
    )

    # Remove the temporary database-level default.
    # The application will manage updated_at from now on.
    op.alter_column(
        "tasks",
        "updated_at",
        server_default=None
    )


def downgrade() -> None:
    """Downgrade database schema."""

    # Remove the foreign key first.
    op.drop_constraint(
        "fk_tasks_project_id",
        "tasks",
        type_="foreignkey"
    )

    # Remove columns added to the existing tasks table.
    op.drop_column(
        "tasks",
        "updated_at"
    )

    op.drop_column(
        "tasks",
        "project_id"
    )

    # Remove the projects table.
    op.drop_table(
        "projects"
    )