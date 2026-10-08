# Day 18 — Background Jobs & Advanced PostgreSQL Search

## Implemented

### 1. Celery task lifecycle in React
- Added `POST /background/invoices/{order_id}` and `POST /background/imports/products` to enqueue jobs.
- Added `GET /background/tasks/{task_id}` to expose Celery `PENDING`, `PROGRESS`, `SUCCESS`, and `FAILURE` states.
- React `BackgroundJobsPanel` polls the status endpoint every second and renders progress bars and completed results.
- Progress metadata is emitted with Celery `update_state()`.

### 2. PDF invoice generation
- `generate_order_invoice` loads an order and all invoice items in one database query.
- ReportLab generates the invoice asynchronously.
- Generated PDFs are stored under `backend/uploads/invoices/` and served through the existing `/uploads` static mount.

### 3. Bulk CSV import
- Admins upload a CSV from React.
- The API stores the file and immediately returns a Celery task ID.
- The worker validates `name`, `price`, and `stock`, imports rows in batches, and reports live progress.
- Optional columns are `description` and `image_url`.

### 4. PostgreSQL full-text search
- Added a PostgreSQL generated `tsvector` column combining product name and description.
- Added a GIN index for the search vector.
- Existing `/products?search=` requests now use PostgreSQL full-text search on PostgreSQL installations.

### 5. Fuzzy search
- Enabled PostgreSQL `pg_trgm`.
- Added GIN trigram indexes on product name and description.
- Existing product search combines full-text matching with similarity matching so small spelling errors can still return relevant products.

### 6. N+1 query optimization
- `OrderItem.product` is now an explicit SQLAlchemy relationship.
- Order list/detail queries eager-load order items and their products with `selectinload`, avoiding one lazy product query per item.
- Invoice generation also uses a single joined query for order-item/product data.

## Required setup

From `backend/`:

```bash
pip install -r requirements.txt
alembic upgrade head
```

Start Redis, the FastAPI server, and a Celery worker:

```bash
uvicorn app.main:app --reload --port 8000
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
```

The worker must have access to the same PostgreSQL database, Redis broker/result backend, and uploads directory as the API process.

## CSV format

```csv
name,description,price,stock,image_url
Wireless Mouse,2.4GHz ergonomic mouse,799,25,
Mechanical Keyboard,RGB keyboard,2499,15,
```

## Flow

```text
React Admin UI
   |
   | POST /background/...
   v
FastAPI
   |
   | Celery task.delay()
   v
Redis Broker ---> Celery Worker ---> PostgreSQL / PDF file
   ^                    |
   |                    | update_state(PROGRESS)
   |                    v
React <--- GET /background/tasks/{task_id}
```
