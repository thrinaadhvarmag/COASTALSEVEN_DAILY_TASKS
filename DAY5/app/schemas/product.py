from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field
)


# ==================================================
# CREATE PRODUCT
# ==================================================

class ProductCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=150
    )

    price: Decimal = Field(
        gt=0,
        max_digits=10,
        decimal_places=2
    )

    user_id: int = Field(
        gt=0
    )


# ==================================================
# UPDATE PRODUCT
# ==================================================

class ProductUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    price: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=10,
        decimal_places=2
    )


# ==================================================
# PRODUCT RESPONSE
# ==================================================

class ProductResponse(BaseModel):

    id: int
    name: str
    price: Decimal
    user_id: int

    model_config = ConfigDict(
        from_attributes=True
    )