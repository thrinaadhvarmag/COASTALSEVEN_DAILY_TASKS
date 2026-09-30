from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.routers import (
    projects,
    tasks,
    auth,
    dashboard,
    reports,
)

from api.exception_handlers import validation_exception_handler


# ---------------------------------------------------------
# FASTAPI APPLICATION
# ---------------------------------------------------------

app = FastAPI(
    title="Task Management API",
    description="REST API for managing projects and tasks",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# UPLOAD DIRECTORY
# ---------------------------------------------------------

Path("uploads").mkdir(
    parents=True,
    exist_ok=True,
)

Path("uploads/projects").mkdir(
    parents=True,
    exist_ok=True,
)

Path("uploads/profiles").mkdir(
    parents=True,
    exist_ok=True,
)


# ---------------------------------------------------------
# STATIC FILES
# ---------------------------------------------------------

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


# ---------------------------------------------------------
# EXCEPTION HANDLERS
# ---------------------------------------------------------

app.add_exception_handler(
    RequestValidationError,
    validation_exception_handler,
)


# ---------------------------------------------------------
# ROUTERS
# ---------------------------------------------------------

app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(reports.router)


# ---------------------------------------------------------
# ROOT ENDPOINT
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Task Management API is running"
    }
