from api.redis_client import sync_redis_client


DASHBOARD_CACHE_PATTERN = "dashboard:summary:*"


def invalidate_dashboard_cache():
    keys = list(
        sync_redis_client.scan_iter(
            match=DASHBOARD_CACHE_PATTERN
        )
    )

    if keys:
        sync_redis_client.delete(*keys)
