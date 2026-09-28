from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.order import OrderResponse
from app.services.order_service import order_service


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_order(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Order:

    return await order_service.create_order(
        user_id=current_user.id,
        user_email=current_user.email,
        db=db,
    )


@router.get(
    "",
    response_model=list[OrderResponse],
)
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Order]:

    return order_service.get_user_orders(
        user_id=current_user.id,
        db=db,
    )


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_my_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Order:

    return order_service.get_user_order(
        user_id=current_user.id,
        order_id=order_id,
        db=db,
    )