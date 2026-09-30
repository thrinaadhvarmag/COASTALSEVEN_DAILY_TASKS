import json

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.async_database import AsyncSessionLocal
from api.models.category import Category
from api.models.project import Project
from api.models.task import Task
from api.models.user import User
from api.redis_client import redis_client
from api.security import get_current_user
from api.services.rate_limiter import check_rate_limit


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


CACHE_TTL = 60


async def get_project_count(
    session: AsyncSession,
    current_user: User,
) -> int:
    query = select(func.count(Project.id))

    if current_user.role != "admin":
        query = query.where(Project.user_id == current_user.id)

    result = await session.execute(query)

    return result.scalar() or 0


async def get_task_count(
    session: AsyncSession,
    current_user: User,
) -> int:
    query = select(func.count(Task.id))

    if current_user.role != "admin":
        query = query.where(Task.assignee_id == current_user.id)

    result = await session.execute(query)

    return result.scalar() or 0


async def get_category_count(
    session: AsyncSession,
    current_user: User,
) -> int:
    if current_user.role == "admin":
        query = select(func.count(Category.id))
    else:
        query = select(
            func.count(func.distinct(Task.category_id))
        ).where(
            Task.assignee_id == current_user.id,
            Task.category_id.is_not(None),
        )

    result = await session.execute(query)

    return result.scalar() or 0


@router.get("/")
async def get_dashboard(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    client_id = request.client.host if request.client else "unknown"

    await check_rate_limit(client_id)

    cache_key = f"dashboard:summary:{current_user.id}"

    # Try Redis cache first.
    try:
        cached_data = await redis_client.get(cache_key)

        if cached_data:
            if isinstance(cached_data, bytes):
                cached_data = cached_data.decode("utf-8")

            return json.loads(cached_data)

    except Exception:
        # Redis should not prevent the dashboard from working.
        # If Redis is unavailable, continue with PostgreSQL.
        pass

    async with AsyncSessionLocal() as session:

        # IMPORTANT:
        # Do NOT run multiple queries concurrently on the same
        # AsyncSession. Execute them sequentially.
        project_count = await get_project_count(
            session,
            current_user,
        )

        task_count = await get_task_count(
            session,
            current_user,
        )

        category_count = await get_category_count(
            session,
            current_user,
        )

    dashboard_data = {
        "projects": project_count,
        "tasks": task_count,
        "categories": category_count,
    }

    # Store the result in Redis when available.
    try:
        await redis_client.set(
            cache_key,
            json.dumps(dashboard_data),
            ex=CACHE_TTL,
        )
    except Exception:
        # Redis failure should not make the dashboard fail.
        pass

    return dashboard_data
