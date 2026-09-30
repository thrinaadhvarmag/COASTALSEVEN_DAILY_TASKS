from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.models.project import Project
from api.models.user import User
from api.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from api.security import get_current_user


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


UPLOAD_DIR = Path("uploads/projects")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_IMAGE_SIZE = 5 * 1024 * 1024


def get_accessible_project(
    project_id: int,
    current_user: User,
    db: Session,
) -> Project:
    query = db.query(Project).filter(Project.id == project_id)

    if current_user.role != "admin":
        query = query.filter(Project.user_id == current_user.id)

    project = query.first()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


def remove_project_file(image_url: str | None) -> None:
    if not image_url:
        return

    filename = Path(image_url).name
    file_path = UPLOAD_DIR / filename

    try:
        if file_path.exists():
            file_path.unlink()
    except OSError:
        # The database record is more important than a failed cleanup.
        pass


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        name=project_data.name,
        description=project_data.description,
        user_id=current_user.id,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@router.get(
    "/",
    response_model=list[ProjectResponse],
)
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Project)

    if current_user.role != "admin":
        query = query.filter(Project.user_id == current_user.id)

    return query.order_by(Project.id).all()


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_accessible_project(project_id, current_user, db)


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_accessible_project(project_id, current_user, db)

    if project_data.name is not None:
        project.name = project_data.name

    if project_data.description is not None:
        project.description = project_data.description

    db.commit()
    db.refresh(project)

    return project


@router.post(
    "/{project_id}/image",
    response_model=ProjectResponse,
)
def upload_project_image(
    project_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_accessible_project(project_id, current_user, db)

    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, and WEBP images are allowed.",
        )

    extension = ALLOWED_IMAGE_TYPES[image.content_type]
    filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    total_size = 0

    try:
        with file_path.open("wb") as buffer:
            while True:
                chunk = image.file.read(1024 * 1024)
                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > MAX_IMAGE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Project image must be 5 MB or smaller.",
                    )

                buffer.write(chunk)
    except HTTPException:
        if file_path.exists():
            file_path.unlink()
        raise
    except OSError as exc:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save project image.",
        ) from exc

    old_image = project.image_url
    project.image_url = f"/uploads/projects/{filename}"

    db.commit()
    db.refresh(project)

    remove_project_file(old_image)

    return project


@router.delete(
    "/{project_id}/image",
    response_model=ProjectResponse,
)
def delete_project_image(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_accessible_project(project_id, current_user, db)

    old_image = project.image_url
    project.image_url = None

    db.commit()
    db.refresh(project)

    remove_project_file(old_image)

    return project


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_accessible_project(project_id, current_user, db)
    old_image = project.image_url

    db.delete(project)
    db.commit()

    remove_project_file(old_image)

    return None
