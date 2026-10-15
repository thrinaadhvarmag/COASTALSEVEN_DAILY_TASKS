@echo off
title Rebel Mart - Server & Worker Launcher
echo ==============================================================================
echo REBEL MART - OFFICIAL REBEL STAR PRABHAS MERCHANDISE
echo Starting Backend (FastAPI), Celery Worker, and Frontend (Vite)
echo ==============================================================================

cd /d "%~dp0backend"
echo [1/3] Seeding database accounts and starting backend on port 8000...
start "Rebel Mart Backend" cmd /k "python -c ""from app.seed import seed_database; seed_database()"" && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Starting Celery background worker...
start "Rebel Mart Celery" cmd /k "celery -A app.celery_app.celery worker --loglevel=info -P solo"

cd /d "%~dp0frontend"
echo [3/3] Starting frontend on port 5173...
start "Rebel Mart Frontend" cmd /k "npm run dev"

echo ==============================================================================
echo Storefront URL:  http://localhost:5173
echo API & Docs:      http://localhost:8000/docs
echo Celery Broker:   Active (SQLite Windows engine)
echo Admin Login:     gunjethrinaadhvarma999@gmail.com / Admin@123456
echo User Login:      bingkosam2@gmail.com / Nanna@123
echo ==============================================================================
pause
