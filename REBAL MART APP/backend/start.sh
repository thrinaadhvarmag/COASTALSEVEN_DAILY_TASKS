#!/usr/bin/env bash
# ==============================================================================
# Rebel Mart — Production Cloud Startup Script (Render / Linux / Docker)
# Launches Celery async worker in background & Uvicorn ASGI server in foreground
# ==============================================================================
set -e

echo "=========================================================="
echo " Starting Rebel Mart Production Backend (Celery + Uvicorn)"
echo "=========================================================="

# Ensure runtime directories exist
mkdir -p data uploads uploads/invoices

# Export flag so embedded worker in app/main.py knows external worker is running
export DISABLE_EMBEDDED_CELERY=true

# Launch Celery worker in background
echo "[STARTUP] Launching Celery background worker..."
celery -A app.celery_app.celery worker --loglevel=info --concurrency=2 &
CELERY_PID=$!
echo "[STARTUP] Celery worker started with PID: $CELERY_PID"

# Signal handler to shut down Celery cleanly when Uvicorn terminates
cleanup() {
    echo "[SHUTDOWN] Terminating Celery worker process ($CELERY_PID)..."
    kill -TERM "$CELERY_PID" 2>/dev/null || true
    wait "$CELERY_PID" 2>/dev/null || true
    echo "[SHUTDOWN] Celery worker terminated cleanly."
}
trap cleanup SIGINT SIGTERM EXIT

# Determine HTTP port
PORT="${PORT:-8000}"
echo "[STARTUP] Starting Uvicorn HTTP server on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
