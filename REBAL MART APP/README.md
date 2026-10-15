# Rebel Mart — Official Rebel Star Merchandise Store

A full-stack, enterprise-grade cinematic e-commerce platform built for Rebel Star merchandise. Features real-time WebSocket communications, Celery background task processing, secure OTP authentication, automated order management, AI Shopping Assistant, and live Admin-Customer support.

---

## 🌟 Key Architecture & Features

### 1. Storefront & Customer Experience
- **Cinematic Design System**: Dynamic dual theme support — Dark Mode (Royal Gold & Deep Charcoal) and Light Mode (Favicon-matched Rebel Crimson & Gold accents).
- **Interactive Product Catalog**: Filtering by cinematic movie universe (Baahubali, Salaar, Kalki 2898 AD, Spirit, Raja Saab), live text search, category filters, and stock tracking.
- **AI Shopping Assistant**: In-store interactive assistant with contextual recommendations and conversational interface.
- **Cart & Fast Checkout**: Streamlined checkout with address management, order summary, simulated payment, and stock deduction.
- **Customer Rewards & Tier System**: Tier badges, points accumulation, and reward tracking.
- **Order Cancellation**: Full self-service order cancellation for processing/confirmed orders with instant inventory release.
- **Order History & Live Tracking**: Real-time status badge updates via WebSocket without page refresh.

### 2. Live Support & Real-time Communications
- **Live Customer-Admin Chat**: Real-time WebSocket support channel (`/ws/chat/<customer_id>`) with automated simulated staff responses, unread message badges, and sound effects.
- **Global Notifications Panel**: Real-time slide-out notification drawer with live ping alerts and relative timestamps.
- **Automatic Reconnection**: Robust exponential backoff WebSocket reconnection handler with reconnection attempts capped at 30 seconds.

### 3. Admin Workspace
- **Analytics & KPIs**: Real-time revenue metrics, order velocity, inventory health, and cancellation metrics.
- **Order Management & Detail Inspector**: Comprehensive order dashboard displaying customer details, ordered items, item costs, quantities, and status management.
- **Product & Inventory Control**: Bulk CSV product import, stock updates, and live catalog edits.
- **Asynchronous Background Tasks**: Celery-powered PDF invoice generation and asynchronous CSV data pipelines.

### 4. Enterprise Security & Hardening
- **Secure OTP Login & Registration**: Real email dispatch via SMTP/SendGrid, secure verification tokens without fallback disclosure, rate-limiting, and timing-safe comparisons.
- **JWT Authentication**: Role-based access control (Admin & Customer roles) protecting REST APIs and WebSocket handshakes.
- **OWASP Compliance**: Content Security Policy headers, sanitized payloads, and CORS isolation.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm 9+
- Redis (optional for local SQLite Celery fallback)

---

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL, JWT secret, and SMTP settings

# Run Alembic migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

Backend will be running at `http://localhost:8000`. Interactive Swagger API docs: `http://localhost:8000/docs`.

---

### Celery Worker Setup

```bash
cd backend
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
```

---

### Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`.

---

### Production Deployment (Docker Compose)

```bash
# Build and run entire stack with Docker Compose
docker-compose up --build -d
```

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti
- **Backend**: FastAPI, SQLAlchemy, Alembic, Celery, Pydantic v2, Python-JOSE
- **Databases**: SQLite (Development) / PostgreSQL (Production), Redis (Broker)
- **Real-Time**: WebSockets (FastAPI native)
