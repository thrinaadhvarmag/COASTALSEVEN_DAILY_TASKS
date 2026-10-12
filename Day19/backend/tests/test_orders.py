import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock, MagicMock

from app.models.order import Order
from app.models.product import Product
from app.services.order_service import order_service
import app.services.order_service as order_service_module


def patch_order_dependencies(
    monkeypatch,
    cart,
):
    cart_get_mock = MagicMock(
        return_value=cart
    )

    cart_clear_mock = MagicMock()

    email_mock = MagicMock()
    delivered_email_mock = MagicMock()

    websocket_mock = AsyncMock()

    monkeypatch.setattr(
        order_service_module.cart_service,
        "get_cart",
        cart_get_mock,
    )

    monkeypatch.setattr(
        order_service_module.cart_service,
        "clear_cart",
        cart_clear_mock,
    )

    monkeypatch.setattr(
        order_service_module.send_order_confirmation_email,
        "delay",
        email_mock,
    )

    monkeypatch.setattr(
        order_service_module.send_order_delivered_email,
        "delay",
        delivered_email_mock,
    )

    monkeypatch.setattr(
        order_service_module.websocket_manager,
        "send_order_status",
        websocket_mock,
    )

    return (
        cart_get_mock,
        cart_clear_mock,
        email_mock,
        delivered_email_mock,
        websocket_mock,
    )


@pytest.mark.asyncio
async def test_create_order_empty_cart(
    db,
    test_user,
    monkeypatch,
):
    patch_order_dependencies(
        monkeypatch,
        {},
    )

    with pytest.raises(HTTPException) as exc_info:
        await order_service.create_order(
            user_id=test_user.id,
            user_email=test_user.email,
            db=db,
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Cart is empty"


@pytest.mark.asyncio
async def test_create_order_success(
    db,
    test_user,
    monkeypatch,
):
    product = Product(
        name="Laptop",
        description="Test laptop",
        price=50000.0,
        stock=10,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    (
        cart_get_mock,
        clear_cart_mock,
        email_mock,
        delivered_email_mock,
        websocket_mock,
    ) = patch_order_dependencies(
        monkeypatch,
        {
            product.id: 2,
        },
    )

    order = await order_service.create_order(
        user_id=test_user.id,
        user_email=test_user.email,
        db=db,
    )

    assert order.id is not None
    assert order.user_id == test_user.id
    assert order.status == "PLACED"
    assert order.total_amount == 100000.0

    assert len(order.items) == 1

    item = order.items[0]

    assert item.product_id == product.id
    assert item.quantity == 2
    assert item.unit_price == 50000.0
    assert item.subtotal == 100000.0

    db.refresh(product)

    assert product.stock == 8

    cart_get_mock.assert_called_once_with(
        test_user.id
    )

    clear_cart_mock.assert_called_once_with(
        test_user.id
    )

    email_mock.assert_called_once_with(
        test_user.email,
        order.id,
        100000.0,
        test_user.username,
    )

    websocket_mock.assert_awaited_once_with(
        user_id=test_user.id,
        order_id=order.id,
        status="PLACED",
    )


@pytest.mark.asyncio
async def test_delivered_status_enqueues_customer_email(
    db,
    test_user,
    monkeypatch,
):
    product = Product(
        name="Delivery Test Product",
        description="Delivery email regression test",
        price=100.0,
        stock=5,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    (
        _cart_get_mock,
        _clear_cart_mock,
        _email_mock,
        delivered_email_mock,
        _websocket_mock,
    ) = patch_order_dependencies(
        monkeypatch,
        {product.id: 1},
    )

    order = await order_service.create_order(
        user_id=test_user.id,
        user_email=test_user.email,
        db=db,
    )

    delivered = await order_service.update_status(
        order.id,
        "CONFIRMED",
        db,
    )
    delivered = await order_service.update_status(
        order.id,
        "PROCESSING",
        db,
    )
    delivered = await order_service.update_status(
        order.id,
        "SHIPPED",
        db,
    )
    delivered = await order_service.update_status(
        order.id,
        "DELIVERED",
        db,
    )

    assert delivered.status == "DELIVERED"
    delivered_email_mock.assert_called_once_with(
        test_user.email,
        order.id,
        order.customer_name,
    )


@pytest.mark.asyncio
async def test_create_order_insufficient_stock(
    db,
    test_user,
    monkeypatch,
):
    product = Product(
        name="Limited Stock Product",
        description="Only two available",
        price=100.0,
        stock=2,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    patch_order_dependencies(
        monkeypatch,
        {
            product.id: 5,
        },
    )

    with pytest.raises(HTTPException) as exc_info:
        await order_service.create_order(
            user_id=test_user.id,
            user_email=test_user.email,
            db=db,
        )

    assert exc_info.value.status_code == 400

    assert "Insufficient stock" in (
        exc_info.value.detail
    )

    assert "Limited Stock Product" in (
        exc_info.value.detail
    )

    assert product.stock == 2


def test_get_user_orders(
    db,
    test_user,
):
    order1 = Order(
        user_id=test_user.id,
        total_amount=1000.0,
        status="PLACED",
    )

    order2 = Order(
        user_id=test_user.id,
        total_amount=2000.0,
        status="PLACED",
    )

    db.add_all(
        [
            order1,
            order2,
        ]
    )

    db.commit()

    orders = order_service.get_user_orders(
        user_id=test_user.id,
        db=db,
    )

    assert len(orders) == 2

    order_ids = {
        order.id
        for order in orders
    }

    assert order1.id in order_ids
    assert order2.id in order_ids