from pydantic import BaseModel, Field


class CartItemRequest(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=10_000)


class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0, le=10_000)


class CartItemResponse(BaseModel):
    product_id: int
    quantity: int


class CartResponse(BaseModel):
    items: list[CartItemResponse]
