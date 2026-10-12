from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.cart import CartItemRequest, CartItemResponse, CartItemUpdate, CartResponse
from app.services.cart_service import CartUnavailableError, cart_service

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


def _build_cart_response(user_id: int) -> CartResponse:
    try:
        items = cart_service.get_cart(user_id)
    except CartUnavailableError:
        raise HTTPException(status_code=503, detail="Shopping cart service is temporarily unavailable")
    return CartResponse(
        items=[CartItemResponse(product_id=pid, quantity=qty) for pid, qty in sorted(items.items())]
    )


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
def add_cart_item(
    item: CartItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    product = db.get(Product, item.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    try:
        current_quantity = cart_service.get_cart(current_user.id).get(item.product_id, 0)
        if current_quantity + item.quantity > product.stock:
            raise HTTPException(status_code=400, detail="Requested cart quantity exceeds available stock")
        cart_service.add_item(current_user.id, item.product_id, item.quantity)
    except CartUnavailableError:
        raise HTTPException(status_code=503, detail="Shopping cart service is temporarily unavailable")
    return _build_cart_response(current_user.id)


@router.get("", response_model=CartResponse)
def get_cart(current_user: User = Depends(get_current_user)) -> CartResponse:
    return _build_cart_response(current_user.id)


@router.put("/items/{product_id}", response_model=CartResponse)
def update_cart_item(
    product_id: int,
    item: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if item.quantity > product.stock:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock")
    try:
        cart_service.update_item(current_user.id, product_id, item.quantity)
    except KeyError:
        raise HTTPException(status_code=404, detail="Product is not in the cart")
    except CartUnavailableError:
        raise HTTPException(status_code=503, detail="Shopping cart service is temporarily unavailable")
    return _build_cart_response(current_user.id)


@router.delete("/items/{product_id}", response_model=CartResponse)
def remove_cart_item(product_id: int, current_user: User = Depends(get_current_user)) -> CartResponse:
    try:
        cart_service.remove_item(current_user.id, product_id)
    except CartUnavailableError:
        raise HTTPException(status_code=503, detail="Shopping cart service is temporarily unavailable")
    return _build_cart_response(current_user.id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(current_user: User = Depends(get_current_user)) -> None:
    try:
        cart_service.clear_cart(current_user.id)
    except CartUnavailableError:
        raise HTTPException(status_code=503, detail="Shopping cart service is temporarily unavailable")
