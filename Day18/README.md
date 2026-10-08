# Rebel Mart — Batch 7 Real-Time Integration

This archive extends the existing Rebel Mart full-stack e-commerce project with the Knowledge Factory Batch 7 real-time tasks.

## Added today

1. Environment-based CORS and frontend API configuration.
2. JWT-protected WebSocket handshakes.
3. Reusable React `useWebSocket` hook.
4. Automatic exponential-backoff WebSocket reconnection.
5. Live order-status updates without page refresh.
6. Global real-time notifications panel.
7. Authenticated admin/customer live chat.
8. Final React + FastAPI + JWT + WebSocket integration.

## Start backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Create .env from .env.example and fill your local credentials.
uvicorn app.main:app --reload --port 8000
```

## Start Celery worker

The Day 18 background jobs use Redis as both the Celery broker and result backend. Start a worker alongside FastAPI:

```bash
cd backend
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
```

Run the Day 18 PostgreSQL migration before using advanced search:

```bash
cd backend
alembic upgrade head
```

## Start frontend

```bash
cd frontend
npm install
# Create .env from .env.example if required.
npm run dev
```

## Day 18 background jobs

The admin dashboard can trigger asynchronous PDF invoice generation and bulk CSV product imports. React polls `/background/tasks/{task_id}` to display Celery progress and completed results. Product search automatically uses PostgreSQL full-text search plus `pg_trgm` similarity when PostgreSQL is configured.

## WebSocket endpoints

- `ws://localhost:8000/ws/orders/<user_id>?token=<JWT>`
- `ws://localhost:8000/ws/chat/<customer_id>?token=<JWT>`

The frontend automatically converts the HTTP API URL to `ws://` or `wss://` as appropriate.

## Reconnection

The reusable hook retries at 1s, 2s, 4s, 8s, 16s and then caps the delay at 30s. Cleanup cancels pending retry timers and closes sockets.

## Security note

Local `.env` files containing database, JWT, or SMTP credentials are intentionally excluded from this archive. Use the supplied `.env.example` files and keep real secrets local.
