import asyncio

from api.redis_client import redis_client


async def test_redis():
    await redis_client.set(
        "test_key",
        "Hello Redis",
        ex=60
    )

    value = await redis_client.get("test_key")

    print("Redis value:", value)

    await redis_client.delete("test_key")

    await redis_client.aclose()


if __name__ == "__main__":
    asyncio.run(test_redis())