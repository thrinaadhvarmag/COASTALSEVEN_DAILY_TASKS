@echo off
echo Starting Rebel Mart Official Merchandise API Backend...
echo Access at: http://localhost:8000
echo Swagger Docs: http://localhost:8000/docs
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
