from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.models.project import Project
from api.models.user import User
from api.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate
)
from api.security import get_current_user
from api.services.cache import invalidate_dashboard_cache


router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


# ---------------------------------------------------------
# CREATE PROJECT
# ---------------------------------------------------------

@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    project = Project(
        name=project_data.name,
        description=project_data.description,
        user_id=current_user.id
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    invalidate_dashboard_cache()

    return project


# ---------------------------------------------------------
# GET PROJECTS
# ---------------------------------------------------------

@router.get(
    "/",
    response_model=list[ProjectResponse]
)
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    query = db.query(Project)

    if current_user.role != "admin":

        query = query.filter(
            Project.user_id == current_user.id
        )

    projects = (
        query
        .order_by(Project.id)
        .all()
    )

    return projects


# ---------------------------------------------------------
# GET SINGLE PROJECT
# ---------------------------------------------------------

@router.get(
    "/{project_id}",
    response_model=ProjectResponse
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    query = (
        db.query(Project)
        .filter(Project.id == project_id)
    )

    if current_user.role != "admin":

        query = query.filter(
            Project.user_id == current_user.id
        )

    project = query.first()

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project


# ---------------------------------------------------------
# UPDATE PROJECT
# ---------------------------------------------------------

@router.put(
    "/{project_id}",
    response_model=ProjectResponse
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    query = (
        db.query(Project)
        .filter(Project.id == project_id)
    )

    if current_user.role != "admin":

        query = query.filter(
            Project.user_id == current_user.id
        )

    project = query.first()

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if project_data.name is not None:
        project.name = project_data.name

    if project_data.description is not None:
        project.description = project_data.description

    db.commit()
    db.refresh(project)

    return project


# ---------------------------------------------------------
# DELETE PROJECT
# ---------------------------------------------------------

@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    query = (
        db.query(Project)
        .filter(Project.id == project_id)
    )

    if current_user.role != "admin":

        query = query.filter(
            Project.user_id == current_user.id
        )

    project = query.first()

    if project is None:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    db.delete(project)
    db.commit()

    invalidate_dashboard_cache()

    return None