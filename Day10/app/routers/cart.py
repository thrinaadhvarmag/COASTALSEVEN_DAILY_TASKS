from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.cart import (
    CartItemRequest,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
)
from app.services.cart_service import cart_service


router = APIRouter(
    prefix="/cart",
    tags=["Shopping Cart"],
)


@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_cart_item(
    item: CartItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:

    product = db.get(Product, item.product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if item.quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested quantity exceeds available stock",
        )

    cart_service.add_item(
        user_id=current_user.id,
        product_id=item.product_id,
        quantity=item.quantity,
    )

    return _build_cart_response(current_user.id)


@router.get(
    "",
    response_model=CartResponse,
)
def get_cart(
    current_user: User = Depends(get_current_user),
) -> CartResponse:

    return _build_cart_response(current_user.id)


@router.put(
    "/items/{product_id}",
    response_model=CartResponse,
)
def update_cart_item(
    product_id: int,
    item: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:

    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if item.quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested quantity exceeds available stock",
        )

    try:
        cart_service.update_item(
            user_id=current_user.id,
            product_id=product_id,
            quantity=item.quantity,
        )
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product is not in the cart",
        )

    return _build_cart_response(current_user.id)


@router.delete(
    "/items/{product_id}",
    response_model=CartResponse,
)
def remove_cart_item(
    product_id: int,
    current_user: User = Depends(get_current_user),
) -> CartResponse:

    cart_service.remove_item(
        user_id=current_user.id,
        product_id=product_id,
    )

    return _build_cart_response(current_user.id)


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
)
def clear_cart(
    current_user: User = Depends(get_current_user),
) -> None:

    cart_service.clear_cart(
        user_id=current_user.id
    )


def _build_cart_response(
    user_id: int,
) -> CartResponse:

    cart = cart_service.get_cart(user_id)

    items = [
        CartItemResponse(
            product_id=product_id,
            quantity=quantity,
        )
        for product_id, quantity in cart.items()
    ]

    return CartResponse(
        items=items,
    )