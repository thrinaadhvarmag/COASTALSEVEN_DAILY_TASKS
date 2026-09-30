# Project Image Feature

This feature adds a persistent image to each Task Manager project.

## Flow

1. React creates/updates the project with JSON.
2. If an image was selected, React sends it as multipart/form-data to:
   POST /projects/{project_id}/image
3. FastAPI validates JPG/PNG/WEBP and a 5 MB limit.
4. FastAPI stores the file under uploads/projects/ with a generated filename.
5. PostgreSQL stores the public relative path in projects.image_url.
6. FastAPI serves the file through /uploads.
7. React displays image_url on each project card.

## Database

Run PGADMIN_MIGRATION.sql in pgAdmin before starting the backend.

## Dependency

Install python-multipart in the backend environment.

## Main.py

Add StaticFiles and mount /uploads as described in main_project_image_additions.txt.

Do not replace unrelated main.py logic; keep your existing routers, exception handlers,
CORS settings, and other middleware.
