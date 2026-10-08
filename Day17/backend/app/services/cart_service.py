import redis
from redis.exceptions import RedisError

from app.core.config import settings

redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=1,
    socket_timeout=1,
)


class CartUnavailableError(RuntimeError):
    """Raised when Redis is unavailable for cart operations."""


class CartService:
    def __init__(self, client: redis.Redis) -> None:
        self.client = client

    def _cart_key(self, user_id: int) -> str:
        return f"cart:{user_id}"

    def add_item(self, user_id: int, product_id: int, quantity: int) -> None:
        key = self._cart_key(user_id)
        try:
            # HINCRBY is atomic in Redis, preventing lost updates when two requests
            # add the same product concurrently.
            self.client.hincrby(key, str(product_id), quantity)
        except RedisError as exc:
            raise CartUnavailableError from exc

    def update_item(self, user_id: int, product_id: int, quantity: int) -> None:
        key = self._cart_key(user_id)
        try:
            if not self.client.hexists(key, str(product_id)):
                raise KeyError("Product is not in the cart")
            self.client.hset(key, str(product_id), quantity)
        except RedisError as exc:
            raise CartUnavailableError from exc

    def remove_item(self, user_id: int, product_id: int) -> None:
        try:
            self.client.hdel(self._cart_key(user_id), str(product_id))
        except RedisError as exc:
            raise CartUnavailableError from exc

    def get_cart(self, user_id: int) -> dict[int, int]:
        try:
            cart = self.client.hgetall(self._cart_key(user_id))
            return {int(product_id): int(quantity) for product_id, quantity in cart.items()}
        except RedisError as exc:
            raise CartUnavailableError from exc

    def clear_cart(self, user_id: int) -> None:
        try:
            self.client.delete(self._cart_key(user_id))
        except RedisError as exc:
            raise CartUnavailableError from exc


cart_service = CartService(redis_client)
