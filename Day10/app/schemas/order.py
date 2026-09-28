from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float

    model_config = ConfigDict(
        from_attributes=True,
    )


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(
        from_attributes=True,
    )