import json
import logging

import redis
from redis.exceptions import RedisError

from app.core.config import settings

logger = logging.getLogger("ecommerce.cache")
PRODUCT_CACHE_DB = 3
redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    db=PRODUCT_CACHE_DB,
    decode_responses=True,
    socket_connect_timeout=1,
    socket_timeout=1,
)
PRODUCT_CACHE_PREFIX = "product:"
PRODUCT_LIST_CACHE_KEY = "products:list"
CACHE_EXPIRE_SECONDS = settings.PRODUCT_CACHE_SECONDS


def _safe_json_load(value: str | None):
    if value is None:
        return None
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return None


def get_product_cache(product_id: int):
    try:
        return _safe_json_load(redis_client.get(f"{PRODUCT_CACHE_PREFIX}{product_id}"))
    except RedisError:
        logger.warning("Product cache unavailable", exc_info=True)
        return None


def set_product_cache(product_id: int, product_data: dict, expire_seconds: int = CACHE_EXPIRE_SECONDS):
    try:
        redis_client.setex(
            f"{PRODUCT_CACHE_PREFIX}{product_id}",
            expire_seconds,
            json.dumps(product_data),
        )
    except RedisError:
        logger.warning("Could not write product cache", exc_info=True)


def delete_product_cache(product_id: int):
    try:
        redis_client.delete(f"{PRODUCT_CACHE_PREFIX}{product_id}")
    except RedisError:
        logger.warning("Could not delete product cache", exc_info=True)


def get_products_cache():
    try:
        return _safe_json_load(redis_client.get(PRODUCT_LIST_CACHE_KEY))
    except RedisError:
        logger.warning("Product list cache unavailable", exc_info=True)
        return None


def set_products_cache(products_data: list[dict], expire_seconds: int = CACHE_EXPIRE_SECONDS):
    try:
        redis_client.setex(
            PRODUCT_LIST_CACHE_KEY,
            expire_seconds,
            json.dumps(products_data),
        )
    except RedisError:
        logger.warning("Could not write product list cache", exc_info=True)


def clear_products_cache():
    try:
        redis_client.delete(PRODUCT_LIST_CACHE_KEY)
    except RedisError:
        logger.warning("Could not clear product list cache", exc_info=True)


def clear_all_product_cache():
    try:
        keys = redis_client.scan_iter(match=f"{PRODUCT_CACHE_PREFIX}*")
        batch = list(keys)
        if batch:
            redis_client.delete(*batch)
        clear_products_cache()
    except RedisError:
        logger.warning("Could not clear product caches", exc_info=True)
