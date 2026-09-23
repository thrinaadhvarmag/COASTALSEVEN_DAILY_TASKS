from typing import List, TYPE_CHECKING

from sqlalchemy import String

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.database import Base


if TYPE_CHECKING:
    from app.models.product import Product


class User(Base):

    __tablename__ = "users"

    # --------------------------------------------------
    # ID
    # --------------------------------------------------

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # --------------------------------------------------
    # NAME
    # --------------------------------------------------

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    # --------------------------------------------------
    # EMAIL
    # --------------------------------------------------

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )
    # --------------------------------------------------
    # PASSWORD
    # --------------------------------------------------

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # --------------------------------------------------
    # ROLE
    # --------------------------------------------------

    role: Mapped[str] = mapped_column(
        String(20),
        default="user",
        nullable=False
    )

    # --------------------------------------------------
    # ACTIVE STATUS
    # --------------------------------------------------

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False
    )
    # --------------------------------------------------
    # RELATIONSHIP
    # --------------------------------------------------

    products: Mapped[List["Product"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan"
    )