from app.routes.files import router as files_router
from app.routes.websocket import router as websocket_router
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="FastAPI Advanced Project",
    description="File Upload and WebSocket Learning Project",
    version="1.0.0",
)


# File upload routes
app.include_router(files_router)


# WebSocket routes
app.include_router(websocket_router)


# Serve uploaded files
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


@app.get("/")
async def root():
    return {"message": "FastAPI Advanced Project is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
