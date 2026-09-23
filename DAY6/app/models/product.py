from typing import TYPE_CHECKING

from sqlalchemy import (
    ForeignKey,
    Numeric,
    String
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.database import Base


if TYPE_CHECKING:
    from app.models.user import User


class Product(Base):

    __tablename__ = "products"

    # --------------------------------------------------
    # ID
    # --------------------------------------------------

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # --------------------------------------------------
    # PRODUCT NAME
    # --------------------------------------------------

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    # --------------------------------------------------
    # PRICE
    # --------------------------------------------------

    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    # --------------------------------------------------
    # USER FOREIGN KEY
    # --------------------------------------------------

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    # --------------------------------------------------
    # RELATIONSHIP
    # --------------------------------------------------

    owner: Mapped["User"] = relationship(
        back_populates="products"
    )