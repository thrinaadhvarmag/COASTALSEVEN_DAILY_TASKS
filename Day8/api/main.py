from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from api.routers import projects, tasks, auth, dashboard
from api.exception_handlers import validation_exception_handler


app = FastAPI(
    title="Task Management API",
    description="REST API for managing projects and tasks",
    version="1.0.0"
)


app.add_exception_handler(
    RequestValidationError,
    validation_exception_handler
)


# ---------------------------------------------------------
# ROUTERS
# ---------------------------------------------------------

app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(auth.router)
app.include_router(dashboard.router)


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Task Management API is running"
    }