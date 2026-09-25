from celery import Celery

celery_app = Celery(
    "task_manager",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
    include=["api.celery_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    beat_schedule={
        "generate-report-every-30-seconds": {
            "task": "api.celery_tasks.generate_report",
            "schedule": 30.0,
        },
    },
)
