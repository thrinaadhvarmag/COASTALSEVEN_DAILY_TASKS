"""
Root Entrypoint for Render Web Service
Allows `uvicorn main:app --host 0.0.0.0 --port $PORT` to run directly from repository root.
"""
import os
import sys

# Add REBAL MART APP/backend to python search path
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "REBAL MART APP", "backend")

if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import FastAPI application
from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
