from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text
)
from sqlalchemy.orm import relationship

from api.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(100),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(20),
        nullable=False,
        default="Pending"
    )

    priority = Column(
        String(20),
        nullable=False,
        default="Medium"
    )

    due_date = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=True
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False
    )

    assignee_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    category = relationship(
        "Category",
        back_populates="tasks"
    )

    project = relationship(
        "Project",
        back_populates="tasks"
    )

    assignee = relationship(
        "User",
        foreign_keys=[assignee_id]
    )