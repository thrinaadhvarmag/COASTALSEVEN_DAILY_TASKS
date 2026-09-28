import json
from typing import Any

import redis

from app.core.config import settings


redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
)


class CartService:
    def __init__(self, client: redis.Redis) -> None:
        self.client = client

    def _cart_key(self, user_id: int) -> str:
        return f"cart:{user_id}"

    def add_item(
        self,
        user_id: int,
        product_id: int,
        quantity: int,
    ) -> None:
        key = self._cart_key(user_id)

        current_quantity = self.client.hget(
            key,
            str(product_id),
        )

        new_quantity = quantity

        if current_quantity is not None:
            new_quantity += int(current_quantity)

        self.client.hset(
            key,
            str(product_id),
            new_quantity,
        )

    def update_item(
        self,
        user_id: int,
        product_id: int,
        quantity: int,
    ) -> None:
        key = self._cart_key(user_id)

        if not self.client.hexists(
            key,
            str(product_id),
        ):
            raise KeyError("Product is not in the cart")

        self.client.hset(
            key,
            str(product_id),
            quantity,
        )

    def remove_item(
        self,
        user_id: int,
        product_id: int,
    ) -> None:
        key = self._cart_key(user_id)

        self.client.hdel(
            key,
            str(product_id),
        )

    def get_cart(
        self,
        user_id: int,
    ) -> dict[int, int]:
        key = self._cart_key(user_id)

        cart = self.client.hgetall(key)

        return {
            int(product_id): int(quantity)
            for product_id, quantity in cart.items()
        }

    def clear_cart(
        self,
        user_id: int,
    ) -> None:
        self.client.delete(
            self._cart_key(user_id)
        )


cart_service = CartService(redis_client)