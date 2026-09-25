import redis
import redis.asyncio as async_redis


# ---------------------------------------------------------
# ASYNC REDIS CLIENT
# Used by async endpoints such as dashboard
# ---------------------------------------------------------

redis_client = async_redis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True
)


# ---------------------------------------------------------
# SYNC REDIS CLIENT
# Used by existing synchronous CRUD routers
# ---------------------------------------------------------

sync_redis_client = redis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True
)