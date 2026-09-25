import time

from fastapi import HTTPException, status

from api.redis_client import redis_client


REQUEST_LIMIT = 5
WINDOW_SECONDS = 60


async def check_rate_limit(client_id: str):

    key = f"rate_limit:{client_id}"

    current_time = time.time()

    window_start = (
        current_time - WINDOW_SECONDS
    )

    # Remove requests outside the current window
    await redis_client.zremrangebyscore(
        key,
        0,
        window_start
    )

    # Count requests inside the window
    request_count = await redis_client.zcard(key)

    # Reject if limit is reached
    if request_count >= REQUEST_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )

    # Add current request timestamp
    await redis_client.zadd(
        key,
        {str(current_time): current_time}
    )

    # Automatically expire the rate-limit key
    await redis_client.expire(
        key,
        WINDOW_SECONDS
    )