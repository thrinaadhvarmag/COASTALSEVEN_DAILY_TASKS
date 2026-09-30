from api.celery_app import celery_app


# ---------------------------------------------------------
# NORMAL CELERY TASK
# ---------------------------------------------------------

@celery_app.task(
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3},
    retry_backoff=True
)
def generate_report():

    print("Report generation started...")

    print("Report generation completed.")

    return "Report generated successfully"


# ---------------------------------------------------------
# SCHEDULED CELERY TASK
# ---------------------------------------------------------

@celery_app.task
def scheduled_cleanup():

    print("Scheduled cleanup task is running...")

    return "Cleanup completed successfully"