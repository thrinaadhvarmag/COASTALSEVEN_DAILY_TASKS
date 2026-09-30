# Task Manager - User-Created Tasks and Projects Update

## New behavior

- Admins can create projects and tasks.
- Normal users can create their own projects.
- Normal users can create tasks inside projects they own.
- A normal user's newly created task is automatically assigned to that same user, even if a different `assignee_id` is sent by the client.
- Admins can assign tasks to any existing user.
- Normal users see only tasks assigned to themselves.
- Normal users can update/delete their own assigned tasks according to the existing status rules.
- Admins can manage all tasks and projects.
- Project IDs are sent as numeric IDs while the frontend displays `#ID — Project Name`.

## Backend change

`routers/tasks.py` now forces `assignee_id = current_user.id` for normal users during task creation and prevents normal users from reassigning a task to another user.

## Run

Backend:

```bash
cd ~/task-manager
source venv/bin/activate
uvicorn api.main:app --reload
```

Frontend:

```bash
cd task-manager-frontend
npm install
npm run dev
```

No database migration is required for this feature; it uses the existing `users`, `projects`, and `tasks` tables.
