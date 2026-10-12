import pytest

from app.models.product import Product
from app.routers.auth import get_current_user
from app.services.cart_service import cart_service


class FakeRedis:
    def __init__(self):
        self.data = {}

    def hget(self, key, field):
        return self.data.get(key, {}).get(str(field))

    def hset(self, key, field, value):
        self.data.setdefault(key, {})
        self.data[key][str(field)] = str(value)

    def hexists(self, key, field):
        return str(field) in self.data.get(key, {})

    def hdel(self, key, field):
        if key in self.data:
            self.data[key].pop(str(field), None)

    def hgetall(self, key):
        return self.data.get(key, {}).copy()

    def delete(self, key):
        self.data.pop(key, None)


@pytest.fixture()
def fake_redis(monkeypatch):
    redis = FakeRedis()

    monkeypatch.setattr(
        cart_service,
        "client",
        redis,
    )

    return redis


@pytest.fixture()
def authenticated_cart_client(
    client,
    test_user,
):
    client.app.dependency_overrides[
        get_current_user
    ] = lambda: test_user

    yield client

    client.app.dependency_overrides.pop(
        get_current_user,
        None,
    )


@pytest.fixture()
def product(db):
    item = Product(
        name="Test Laptop",
        description="Laptop used for cart testing",
        price=50000.0,
        stock=10,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


def test_get_empty_cart(
    authenticated_cart_client,
    fake_redis,
):
    response = authenticated_cart_client.get(
        "/cart"
    )

    assert response.status_code == 200
    assert response.json()["items"] == []


def test_add_item_to_cart(
    authenticated_cart_client,
    fake_redis,
    product,
):
    response = authenticated_cart_client.post(
        "/cart/items",
        json={
            "product_id": product.id,
            "quantity": 2,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == product.id
    assert data["items"][0]["quantity"] == 2


def test_add_same_product_increases_quantity(
    authenticated_cart_client,
    fake_redis,
    product,
):
    authenticated_cart_client.post(
        "/cart/items",
        json={
            "product_id": product.id,
            "quantity": 2,
        },
    )

    response = authenticated_cart_client.post(
        "/cart/items",
        json={
            "product_id": product.id,
            "quantity": 3,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["items"][0]["quantity"] == 5


def test_update_cart_item(
    authenticated_cart_client,
    fake_redis,
    product,
):
    authenticated_cart_client.post(
        "/cart/items",
        json={
            "product_id": product.id,
            "quantity": 2,
        },
    )

    response = authenticated_cart_client.put(
        f"/cart/items/{product.id}",
        json={
            "quantity": 5,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["items"][0]["product_id"] == product.id
    assert data["items"][0]["quantity"] == 5


def test_remove_cart_item(
    authenticated_cart_client,
    fake_redis,
    product,
):
    authenticated_cart_client.post(
        "/cart/items",
        json={
            "product_id": product.id,
            "quantity": 2,
        },
    )

    response = authenticated_cart_client.delete(
        f"/cart/items/{product.id}"
    )

    assert response.status_code == 200
    assert response.json()["items"] == []