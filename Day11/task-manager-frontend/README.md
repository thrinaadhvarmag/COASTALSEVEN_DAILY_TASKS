# Task Manager Frontend

React + Vite frontend integrated with the Task Management FastAPI backend.

## Backend contract used

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/users` (admin)
- `GET /auth/admin-only` (admin)
- `GET /tasks/`
- `POST /tasks/`
- `GET /tasks/{task_id}`
- `PUT /tasks/{task_id}`
- `DELETE /tasks/{task_id}`
- `GET /projects/`
- `POST /projects/`
- `GET /projects/{project_id}`
- `PUT /projects/{project_id}`
- `DELETE /projects/{project_id}`
- `GET /dashboard/`
- `POST /reports/generate`

## Run

Start FastAPI first:

```bash
cd ~/task-manager
source venv/bin/activate
uvicorn api.main:app --reload
```

Then start React:

```bash
cd ~/task-manager-frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Authentication

The login API returns a JWT. The frontend stores the access token in `localStorage` and Axios automatically sends:

```text
Authorization: Bearer <access_token>
```

Protected routes redirect unauthenticated users to `/login`.

## API URL

The default API URL is `http://127.0.0.1:8000`.
To override it, create `.env` from `.env.example`:

```bash
cp .env.example .env
```

and change `VITE_API_URL` if required.

## Validation

```bash
npm run lint
npm run build
```
