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


def test_login(client, user_payload, monkeypatch):
    register_response = client.post(
        "/auth/register",
        json=user_payload,
    )

    assert register_response.status_code == 201

    monkeypatch.setattr("app.routers.auth._generate_otp", lambda: "123456")
    monkeypatch.setattr("app.routers.auth.send_login_otp_email.delay", lambda email, otp: type("Task", (), {"id": "test-login-otp-task"})())

    response = client.post(
        "/auth/login",
        json={
            "email": user_payload["email"],
            "password": user_payload["password"],
        },
    )

    assert response.status_code == 202
    data = response.json()
    assert data["otp_required"] is True
    assert data["email"] == user_payload["email"]
    assert data["task_id"] == "test-login-otp-task"

    verify = client.post(
        "/auth/login/verify",
        json={"email": user_payload["email"], "otp": "123456"},
    )
    assert verify.status_code == 200
    assert "access_token" in verify.json()
    assert verify.json()["token_type"] == "bearer"


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


def test_get_current_user(client, user_payload, monkeypatch):
    register_response = client.post(
        "/auth/register",
        json=user_payload,
    )

    assert register_response.status_code == 201

    monkeypatch.setattr("app.routers.auth._generate_otp", lambda: "123456")
    monkeypatch.setattr("app.routers.auth.send_login_otp_email.delay", lambda email, otp: type("Task", (), {"id": "test-login-otp-task"})())

    login_response = client.post(
        "/auth/login",
        json={
            "email": user_payload["email"],
            "password": user_payload["password"],
        },
    )

    assert login_response.status_code == 202
    verify_response = client.post("/auth/login/verify", json={"email": user_payload["email"], "otp": "123456"})
    assert verify_response.status_code == 200
    token = verify_response.json()["access_token"]

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

def test_email_is_normalized(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "normalized_user",
            "email": " Normalized@Example.COM ",
            "password": "Test@12345",
        },
    )
    assert response.status_code == 201
    assert response.json()["email"] == "normalized@example.com"


def test_invalid_otp(client, user_payload, monkeypatch):
    client.post("/auth/register", json=user_payload)
    monkeypatch.setattr("app.routers.auth._generate_otp", lambda: "123456")
    monkeypatch.setattr("app.routers.auth.send_login_otp_email.delay", lambda email, otp: type("Task", (), {"id": "test-login-otp-task"})())
    response = client.post("/auth/login", json={"email": user_payload["email"], "password": user_payload["password"]})
    assert response.status_code == 202
    verify = client.post("/auth/login/verify", json={"email": user_payload["email"], "otp": "999999"})
    assert verify.status_code == 401


def test_otp_verification_marks_email_verified(client, user_payload, monkeypatch):
    client.post("/auth/register", json=user_payload)
    monkeypatch.setattr("app.routers.auth._generate_otp", lambda: "123456")
    monkeypatch.setattr("app.routers.auth.send_login_otp_email.delay", lambda email, otp: type("Task", (), {"id": "test-login-otp-task"})())
    client.post("/auth/login", json={"email": user_payload["email"], "password": user_payload["password"]})
    verify = client.post("/auth/login/verify", json={"email": user_payload["email"], "otp": "123456"})
    assert verify.status_code == 200
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {verify.json()['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email_verified"] is True
