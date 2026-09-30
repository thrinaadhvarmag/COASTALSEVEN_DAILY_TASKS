# Task Manager — Today's upgrade

## Existing behavior preserved
JWT authentication, admin/user authorization, projects, tasks, PostgreSQL, Redis, Celery, Flower/reporting and the existing routes remain in place.

## New functionality
- Tailwind CSS v4 via the Vite plugin.
- Class-based dark mode with a theme toggle.
- Reusable shadcn-style Button, Dialog, Table, Toast, Dropdown, Input, Select and Textarea components.
- React Hook Form + Zod validation for the task workflow.
- Three-step task creation flow.
- Dynamic checklist/subtask fields.
- Drag-and-drop task attachments with image preview and PDF support.
- FastAPI checklist and attachment endpoints.
- New `task_checklist_items` and `task_attachments` tables.
- Accessible labels, error messages, keyboard/Escape dialog handling, ARIA attributes and focus states.

## Database note
Startup uses SQLAlchemy `create_all()` only to create missing new tables. Existing tables are not altered. For a production deployment, use Alembic migrations for schema changes.
