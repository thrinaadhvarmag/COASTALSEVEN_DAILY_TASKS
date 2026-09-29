import asyncio
import json

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from api.async_database import AsyncSessionLocal
from api.models.project import Project
from api.models.task import Task
from api.models.category import Category
from api.models.user import User
from api.redis_client import redis_client
from api.security import get_current_user
from api.services.rate_limiter import check_rate_limit


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


CACHE_TTL = 60


async def get_project_count(
    session: AsyncSession,
    current_user: User
):
    query = select(func.count(Project.id))

    if current_user.role != "admin":
        query = query.where(Project.user_id == current_user.id)

    result = await session.execute(query)
    return result.scalar() or 0


async def get_task_count(
    session: AsyncSession,
    current_user: User
):
    query = select(func.count(Task.id))

    if current_user.role != "admin":
        query = query.where(Task.assignee_id == current_user.id)

    result = await session.execute(query)
    return result.scalar() or 0


async def get_category_count(
    session: AsyncSession,
    current_user: User
):
    if current_user.role == "admin":
        query = select(func.count(Category.id))
    else:
        query = select(
            func.count(func.distinct(Task.category_id))
        ).where(
            Task.assignee_id == current_user.id,
            Task.category_id.is_not(None)
        )

    result = await session.execute(query)
    return result.scalar() or 0


@router.get("/")
async def get_dashboard(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    client_id = request.client.host
    await check_rate_limit(client_id)

    cache_key = f"dashboard:summary:{current_user.id}"

    cached_data = await redis_client.get(cache_key)

    if cached_data:
        return json.loads(cached_data)

    async with AsyncSessionLocal() as session:
        project_count, task_count, category_count = await asyncio.gather(
            get_project_count(session, current_user),
            get_task_count(session, current_user),
            get_category_count(session, current_user),
        )

    dashboard_data = {
        "projects": project_count,
        "tasks": task_count,
        "categories": category_count,
    }

    await redis_client.set(
        cache_key,
        json.dumps(dashboard_data),
        ex=CACHE_TTL
    )

    return dashboard_data
