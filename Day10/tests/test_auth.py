def test_register_user(client, user_payload):
    response = client.post(
        "/auth/register",
        json=user_payload,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["username"] == user_payload["username"]
    assert data["email"] == user_payload["email"]
    assert "id" in data


def test_duplicate_registration(client, user_payload):
    first_response = client.post(
        "/auth/register",
        json=user_payload,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/auth/register",
        json=user_payload,
    )

    assert second_response.status_code == 409

    assert second_response.json()["detail"] == (
        "Username or email already exists"
    )


def test_login(client, user_payload):
    register_response = client.post(
        "/auth/register",
        json=user_payload,
    )

    assert register_response.status_code == 201

    response = client.post(
        "/auth/login",
        json={
            "email": user_payload["email"],
            "password": user_payload["password"],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_invalid_login(client, user_payload):
    register_response = client.post(
        "/auth/register",
        json=user_payload,
    )

    assert register_response.status_code == 201

    response = client.post(
        "/auth/login",
        json={
            "email": user_payload["email"],
            "password": "WrongPassword@123",
        },
    )

    assert response.status_code == 401

    assert response.json()["detail"] == (
        "Invalid email or password"
    )


def test_get_current_user(client, user_payload):
    register_response = client.post(
        "/auth/register",
        json=user_payload,
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={
            "email": user_payload["email"],
            "password": user_payload["password"],
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["username"] == user_payload["username"]
    assert data["email"] == user_payload["email"]


def test_me_without_token(client):
    response = client.get("/auth/me")

    assert response.status_code == 401