from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field
)

from app.schemas.product import ProductResponse


# ==================================================
# CREATE USER
# ==================================================

class UserCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr


# ==================================================
# UPDATE USER
# ==================================================

class UserUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    email: EmailStr | None = None


# ==================================================
# USER RESPONSE
# ==================================================

class UserResponse(BaseModel):

    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(
        from_attributes=True
    )


# ==================================================
# USER + PRODUCTS RESPONSE
# ==================================================

class UserWithProducts(UserResponse):

    products: list[ProductResponse] = Field(
        default_factory=list
    )

    model_config = ConfigDict(
        from_attributes=True
    )