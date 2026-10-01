import os

# Test configuration is intentionally self-contained so the suite does not need
# a developer's .env file or production credentials.
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("DEBUG", "false")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_ecommerce.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret-key-that-is-long-enough-for-tests-123456")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("CELERY_BROKER_URL", "redis://localhost:6379/1")
os.environ.setdefault("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
os.environ.setdefault("SMTP_HOST", "localhost")
os.environ.setdefault("SMTP_PORT", "1025")
os.environ.setdefault("SMTP_USERNAME", "test@example.com")
os.environ.setdefault("SMTP_PASSWORD", "test")
os.environ.setdefault("CORS_ORIGINS", "http://testserver")
os.environ.setdefault("UPLOAD_DIR", "uploads/test-products")
os.environ.setdefault("TEST_DATABASE_URL", "sqlite:///./test_ecommerce.db")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.security import hash_password
from app.database import Base, get_db
from app.main import app
from app.models.user import User

TEST_DATABASE_URL = os.environ["TEST_DATABASE_URL"]
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def test_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db(test_database):
    session = TestingSessionLocal()
    try:
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
    return {"username": "testuser", "email": "testuser@example.com", "password": "Test@12345"}


@pytest.fixture()
def test_user(db: Session):
    user = User(username="service_test_user", email="service_test_user@example.com", hashed_password=hash_password("Test@12345"))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def auth_headers(client, user_payload):
    register_response = client.post("/auth/register", json=user_payload)
    assert register_response.status_code == 201
    login_response = client.post("/auth/login", json={"email": user_payload["email"], "password": user_payload["password"]})
    assert login_response.status_code == 200
    return {"Authorization": f"Bearer {login_response.json()['access_token']}"}
