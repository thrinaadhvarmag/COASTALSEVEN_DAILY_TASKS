import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.security import hash_password
from app.database import Base, get_db
from app.main import app
from app.models.user import User


TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://postgres:hv12345@localhost:5432/ecommerce_test",
)


engine = create_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True,
)


TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


@pytest.fixture(scope="session")
def test_database():
    Base.metadata.create_all(bind=engine)

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db(test_database):
    session = TestingSessionLocal()

    try:
        # Clean all tables before every test.
        # Reverse dependency order so child tables
        # are deleted before parent tables.
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())

        session.commit()

        yield session

    finally:
        session.rollback()
        session.close()


@pytest.fixture()
def client(db: Session):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def user_payload():
    return {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "Test@12345",
    }


@pytest.fixture()
def test_user(db: Session):
    user = User(
        username="service_test_user",
        email="service_test_user@example.com",
        hashed_password=hash_password(
            "Test@12345"
        ),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@pytest.fixture()
def auth_headers(client, user_payload):
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

    return {
        "Authorization": f"Bearer {token}"
    }