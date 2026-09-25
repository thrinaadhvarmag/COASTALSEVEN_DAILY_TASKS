from api.redis_client import sync_redis_client


DASHBOARD_CACHE_KEY = "dashboard:summary"


def invalidate_dashboard_cache():
    sync_redis_client.delete(DASHBOARD_CACHE_KEY)