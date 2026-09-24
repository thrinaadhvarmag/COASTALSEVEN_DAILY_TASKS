from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.models.task import Task
from api.models.project import Project
from api.models.user import User
from api.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse
)
from api.security import get_current_user


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)


# ---------------------------------------------------------
# ALLOWED VALUES
# ---------------------------------------------------------

ALLOWED_STATUSES = {
    "Pending",
    "In Progress",
    "Completed"
}

ALLOWED_PRIORITIES = {
    "Low",
    "Medium",
    "High"
}


# ---------------------------------------------------------
# VALIDATION FUNCTIONS
# ---------------------------------------------------------

def validate_status(status_value: str):
    if status_value not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status. Allowed values are: "
                f"{', '.join(ALLOWED_STATUSES)}"
            )
        )


def validate_priority(priority_value: str):
    if priority_value not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid priority. Allowed values are: "
                f"{', '.join(ALLOWED_PRIORITIES)}"
            )
        )


def validate_status_transition(
    current_status: str,
    new_status: str
):
    allowed_transitions = {
        "Pending": {
            "Pending",
            "In Progress"
        },
        "In Progress": {
            "In Progress",
            "Completed"
        },
        "Completed": {
            "Completed"
        }
    }

    if new_status not in allowed_transitions[current_status]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status transition: "
                f"{current_status} -> {new_status}"
            )
        )


# ---------------------------------------------------------
# PROJECT VALIDATION
# ---------------------------------------------------------

def get_user_project(
    project_id: int,
    current_user: User,
    db: Session
):
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project


# ---------------------------------------------------------
# ASSIGNEE VALIDATION
# ---------------------------------------------------------

def get_assignee(
    assignee_id: int,
    db: Session
):
    user = (
        db.query(User)
        .filter(User.id == assignee_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Assignee user not found"
        )

    return user


# ---------------------------------------------------------
# CREATE TASK
# ---------------------------------------------------------

@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED
)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate status
    validate_status(task_data.status)

    # Validate priority
    validate_priority(task_data.priority)

    # Check project ownership
    get_user_project(
        task_data.project_id,
        current_user,
        db
    )

    # Check assignee if provided
    if task_data.assignee_id is not None:
        get_assignee(
            task_data.assignee_id,
            db
        )

    task = Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        category_id=task_data.category_id,
        project_id=task_data.project_id,
        assignee_id=task_data.assignee_id,
        due_date=task_data.due_date
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


# ---------------------------------------------------------
# GET TASKS
# ---------------------------------------------------------

@router.get(
    "/",
    response_model=list[TaskResponse]
)
def get_tasks(
    status_filter: str | None = Query(
        default=None,
        alias="status"
    ),
    priority: str | None = None,
    assignee_id: int | None = None,
    due_date: datetime | None = None,
    skip: int = Query(
        default=0,
        ge=0
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        db.query(Task)
        .join(Project)
        .filter(
            Project.user_id == current_user.id
        )
    )

    # Filter by status
    if status_filter is not None:
        validate_status(status_filter)

        query = query.filter(
            Task.status == status_filter
        )

    # Filter by priority
    if priority is not None:
        validate_priority(priority)

        query = query.filter(
            Task.priority == priority
        )

    # Filter by assignee
    if assignee_id is not None:
        query = query.filter(
            Task.assignee_id == assignee_id
        )

    # Filter by due date
    if due_date is not None:
        query = query.filter(
            Task.due_date == due_date
        )

    # Pagination
    tasks = (
        query
        .offset(skip)
        .limit(limit)
        .all()
    )

    return tasks


# ---------------------------------------------------------
# GET SINGLE TASK
# ---------------------------------------------------------

@router.get(
    "/{task_id}",
    response_model=TaskResponse
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = (
        db.query(Task)
        .join(Project)
        .filter(
            Task.id == task_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task


# ---------------------------------------------------------
# UPDATE TASK
# ---------------------------------------------------------

@router.put(
    "/{task_id}",
    response_model=TaskResponse
)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = (
        db.query(Task)
        .join(Project)
        .filter(
            Task.id == task_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    update_data = task_data.model_dump(
        exclude_unset=True
    )

    # Validate status
    if "status" in update_data:
        validate_status(
            update_data["status"]
        )

        validate_status_transition(
            task.status,
            update_data["status"]
        )

    # Validate priority
    if "priority" in update_data:
        validate_priority(
            update_data["priority"]
        )

    # Validate new project
    if "project_id" in update_data:
        get_user_project(
            update_data["project_id"],
            current_user,
            db
        )

    # Validate assignee
    if "assignee_id" in update_data:
        if update_data["assignee_id"] is not None:
            get_assignee(
                update_data["assignee_id"],
                db
            )

    # Apply changes
    for field, value in update_data.items():
        setattr(
            task,
            field,
            value
        )

    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)

    return task


# ---------------------------------------------------------
# DELETE TASK
# ---------------------------------------------------------

@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = (
        db.query(Task)
        .join(Project)
        .filter(
            Task.id == task_id,
            Project.user_id == current_user.id
        )
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    db.delete(task)
    db.commit()

    return None