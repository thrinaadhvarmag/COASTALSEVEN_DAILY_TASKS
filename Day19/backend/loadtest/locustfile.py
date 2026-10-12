import os

from locust import HttpUser, between, task


class RebelMartUser(HttpUser):
    """Realistic API smoke/load profile for 50 concurrent users.

    Run with: locust -f backend/loadtest/locustfile.py --headless -u 50 -r 10 -t 2m
    Set LOCUST_ACCESS_TOKEN to exercise authenticated endpoints.
    """

    wait_time = between(1, 3)

    def on_start(self):
        token = os.getenv("LOCUST_ACCESS_TOKEN", "").strip()
        self.auth_headers = {"Authorization": f"Bearer {token}"} if token else {}

    @task(5)
    def health(self):
        self.client.get("/health", name="GET /health")

    @task(8)
    def products(self):
        if not self.auth_headers:
            return
        self.client.get(
            "/products?page=1&page_size=20",
            headers=self.auth_headers,
            name="GET /products",
        )

    @task(4)
    def product_count(self):
        if not self.auth_headers:
            return
        self.client.get(
            "/products/count",
            headers=self.auth_headers,
            name="GET /products/count",
        )

    @task(3)
    def cart(self):
        if not self.auth_headers:
            return
        self.client.get("/cart", headers=self.auth_headers, name="GET /cart")

    @task(2)
    def orders(self):
        if not self.auth_headers:
            return
        self.client.get(
            "/orders?page=1&page_size=20",
            headers=self.auth_headers,
            name="GET /orders",
        )
