"""add user ownership to projects

Revision ID: 5c5e8c052509
Revises: df83836123bc
Create Date: 2026-09-24 14:40:05.916414
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5c5e8c052509"
down_revision: Union[str, Sequence[str], None] = "df83836123bc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1. Add user_id temporarily as nullable
    op.add_column(
        "projects",
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=True
        )
    )

    # 2. Assign existing projects to the existing user
    op.execute(
        "UPDATE projects SET user_id = 1"
    )

    # 3. Make user_id mandatory
    op.alter_column(
        "projects",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False
    )

    # 4. Create index
    op.create_index(
        "ix_projects_user_id",
        "projects",
        ["user_id"],
        unique=False
    )

    # 5. Create foreign key
    op.create_foreign_key(
        "fk_projects_user_id_users",
        "projects",
        "users",
        ["user_id"],
        ["id"]
    )


def downgrade() -> None:
    """Downgrade schema."""

    # Remove foreign key
    op.drop_constraint(
        "fk_projects_user_id_users",
        "projects",
        type_="foreignkey"
    )

    # Remove index
    op.drop_index(
        "ix_projects_user_id",
        table_name="projects"
    )

    # Remove column
    op.drop_column(
        "projects",
        "user_id"
    )