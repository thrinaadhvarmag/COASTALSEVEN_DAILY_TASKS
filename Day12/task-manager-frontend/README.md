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

## Today's learning/implementation coverage

The Tasks screen now demonstrates Tailwind CSS, dark mode, reusable shadcn-style UI components, React Hook Form, Zod validation, a three-step form, dynamic checklist fields, react-dropzone file upload, image preview, accessibility attributes and FastAPI integration.

The backend adds task checklist and attachment persistence. New tables are created automatically on startup for local development; use Alembic migrations for production schema management.

## Neon Aurora Theme Update

The frontend now uses a centralized Light/Dark theme token system in `src/index.css`.
Both modes update the main surfaces, text, borders, inputs, buttons, tables, cards, dialogs, dropdowns, upload areas and status elements. The visual layer also adds a subtle grid/aurora background, glass-like surfaces, controlled neon accents, focus glows and hover effects.

The theme is intentionally implemented in CSS so the existing React functionality and API integration are unchanged.
