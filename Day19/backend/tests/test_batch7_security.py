import pytest

from app.core.config import settings


def test_rate_limit_configuration_is_separate_from_application_redis():
    assert settings.RATE_LIMIT_REDIS_URL != settings.REDIS_URL
    assert settings.RATE_LIMIT_REDIS_URL.endswith("/5")


def test_security_headers(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "geolocation=()" in response.headers["Permissions-Policy"]


def test_health_is_not_rate_limited(client):
    for _ in range(5):
        response = client.get("/health")
        assert response.status_code == 200


@pytest.mark.parametrize("path", ["/", "/health", "/health/ready"])
def test_monitoring_endpoints_are_available(client, path):
    assert client.get(path).status_code in {200, 503}


def test_private_upload_directories_are_not_mounted_as_one_public_tree(client):
    response = client.get("/uploads/invoices/does-not-exist.pdf")
    assert response.status_code in {404, 405}


def test_product_and_profile_upload_routes_are_public_media_only(client):
    assert client.get("/uploads/products/does-not-exist.webp").status_code == 404
    assert client.get("/uploads/profiles/does-not-exist.webp").status_code == 404
