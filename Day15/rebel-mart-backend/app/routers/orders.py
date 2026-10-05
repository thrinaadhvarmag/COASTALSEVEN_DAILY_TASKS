from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_role
from app.database import get_db
from app.models.order import Order
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.order import CheckoutDetails, OrderResponse, OrderStatusUpdate
from app.services.order_service import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    checkout: CheckoutDetails | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Order:
    return await order_service.create_order(
        current_user.id,
        current_user.email,
        db,
        checkout=checkout,
        fallback_name=current_user.username,
    )


@router.get("", response_model=list[OrderResponse])
def get_my_orders(page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Order]:
    return order_service.get_user_orders(current_user.id, db, page, page_size)


@router.get("/admin/all", response_model=list[OrderResponse])
def get_all_orders(page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))) -> list[Order]:
    return order_service.get_all_orders(db, page, page_size)


@router.patch("/admin/{order_id}/status", response_model=OrderResponse)
async def update_order_status(order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))) -> Order:
    return await order_service.update_status(order_id, payload.status.value, db)


@router.get("/{order_id}", response_model=OrderResponse)
def get_my_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Order:
    return order_service.get_user_order(current_user.id, order_id, db)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Order:
    return await order_service.cancel_order(current_user.id, order_id, db)
