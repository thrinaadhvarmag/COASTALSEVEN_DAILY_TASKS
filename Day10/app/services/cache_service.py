import json

import redis

from app.core.config import settings


PRODUCT_CACHE_DB = 3

redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    db=PRODUCT_CACHE_DB,
    decode_responses=True,
)


PRODUCT_CACHE_PREFIX = "product:"
PRODUCT_LIST_CACHE_KEY = "products:list"

CACHE_EXPIRE_SECONDS = 300


def get_product_cache(product_id: int):
    key = f"{PRODUCT_CACHE_PREFIX}{product_id}"

    cached_product = redis_client.get(key)

    if cached_product is None:
        return None

    return json.loads(cached_product)


def set_product_cache(
    product_id: int,
    product_data: dict,
    expire_seconds: int = CACHE_EXPIRE_SECONDS,
):
    key = f"{PRODUCT_CACHE_PREFIX}{product_id}"

    redis_client.setex(
        key,
        expire_seconds,
        json.dumps(product_data),
    )


def delete_product_cache(product_id: int):
    key = f"{PRODUCT_CACHE_PREFIX}{product_id}"

    redis_client.delete(key)


def get_products_cache():
    cached_products = redis_client.get(
        PRODUCT_LIST_CACHE_KEY
    )

    if cached_products is None:
        return None

    return json.loads(cached_products)


def set_products_cache(
    products_data: list[dict],
    expire_seconds: int = CACHE_EXPIRE_SECONDS,
):
    redis_client.setex(
        PRODUCT_LIST_CACHE_KEY,
        expire_seconds,
        json.dumps(products_data),
    )


def clear_products_cache():
    redis_client.delete(
        PRODUCT_LIST_CACHE_KEY
    )


def clear_all_product_cache():
    keys = redis_client.keys(
        f"{PRODUCT_CACHE_PREFIX}*"
    )

    if keys:
        redis_client.delete(*keys)

    redis_client.delete(
        PRODUCT_LIST_CACHE_KEY
    )