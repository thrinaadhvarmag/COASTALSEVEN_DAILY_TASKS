from app.models.product import Product


def test_get_products(
    client,
    auth_headers,
    db,
):
    product = Product(
        name="Test Laptop",
        description="Laptop for testing",
        price=50000.0,
        stock=10,
    )

    db.add(product)
    db.commit()

    response = client.get(
        "/products",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_product(
    client,
    auth_headers,
    db,
):
    product = Product(
        name="Test Phone",
        description="Phone for testing",
        price=30000.0,
        stock=5,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    response = client.get(
        f"/products/{product.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == product.id
    assert data["name"] == "Test Phone"
    assert data["price"] == 30000.0
    assert data["stock"] == 5


def test_get_product_not_found(
    client,
    auth_headers,
):
    response = client.get(
        "/products/999999",
        headers=auth_headers,
    )

    assert response.status_code == 404

    assert response.json()["detail"] == (
        "Product not found"
    )


def test_product_validation(
    client,
    auth_headers,
):
    response = client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "Invalid Product",
            "description": "Invalid product",
            "price": -100,
            "stock": 10,
        },
    )

    assert response.status_code in (400, 403, 422)