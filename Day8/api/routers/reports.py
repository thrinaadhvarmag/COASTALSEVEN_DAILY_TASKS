from fastapi import APIRouter
from api.celery_tasks import generate_report

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.post("/generate")
def generate_report_background():
    task = generate_report.delay()

    return {
        "message": "Report generation started in background",
        "task_id": task.id,
        "status": "PENDING"
    }