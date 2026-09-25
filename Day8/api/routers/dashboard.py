import asyncio
import json

from fastapi import APIRouter, Request
from sqlalchemy import select, func

from api.async_database import AsyncSessionLocal
from api.models.project import Project
from api.models.task import Task
from api.models.category import Category
from api.redis_client import redis_client
from api.services.rate_limiter import check_rate_limit


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


CACHE_KEY = "dashboard:summary"
CACHE_TTL = 60


# ---------------------------------------------------------
# PROJECT COUNT
# ---------------------------------------------------------

async def get_project_count():

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(func.count(Project.id))
        )

        return result.scalar()


# ---------------------------------------------------------
# TASK COUNT
# ---------------------------------------------------------

async def get_task_count():

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(func.count(Task.id))
        )

        return result.scalar()


# ---------------------------------------------------------
# CATEGORY COUNT
# ---------------------------------------------------------

async def get_category_count():

    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(func.count(Category.id))
        )

        return result.scalar()


# ---------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------

@router.get("/")
async def get_dashboard(
    request: Request
):

    # -----------------------------------------------------
    # RATE LIMITING
    # -----------------------------------------------------

    client_id = request.client.host

    await check_rate_limit(client_id)

    # -----------------------------------------------------
    # CHECK CACHE
    # -----------------------------------------------------

    cached_data = await redis_client.get(
        CACHE_KEY
    )

    if cached_data:

        print("CACHE HIT")

        return json.loads(cached_data)

    print("CACHE MISS")

    # -----------------------------------------------------
    # FETCH DATA IN PARALLEL
    # -----------------------------------------------------

    (
        project_count,
        task_count,
        category_count
    ) = await asyncio.gather(
        get_project_count(),
        get_task_count(),
        get_category_count()
    )

    dashboard_data = {
        "projects": project_count,
        "tasks": task_count,
        "categories": category_count
    }

    # -----------------------------------------------------
    # STORE IN REDIS
    # -----------------------------------------------------

    await redis_client.set(
        CACHE_KEY,
        json.dumps(dashboard_data),
        ex=CACHE_TTL
    )

    return dashboard_data