from io import BytesIO
from pathlib import Path
from uuid import uuid4

from app.routes.websocket import manager
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

router = APIRouter(
    prefix="/files",
    tags=["File Uploads"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


MAX_FILE_SIZE = 5 * 1024 * 1024

MAX_IMAGE_SIZE = (800, 800)


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload, validate, resize and save an image.

    After a successful upload, a real-time notification
    is sent to all connected WebSocket clients.
    """

    # --------------------------------------------------
    # 1. Check filename
    # --------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected",
        )

    # --------------------------------------------------
    # 2. Validate MIME type
    # --------------------------------------------------

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid file type. " "Only JPEG, PNG and WEBP images are allowed."
            ),
        )

    # --------------------------------------------------
    # 3. Validate file extension
    # --------------------------------------------------

    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=("Unsupported image extension. " "Use JPG, JPEG, PNG or WEBP."),
        )

    # --------------------------------------------------
    # 4. Read uploaded file
    # --------------------------------------------------

    contents = await file.read()

    file_size = len(contents)

    # --------------------------------------------------
    # 5. Check empty file
    # --------------------------------------------------

    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    # --------------------------------------------------
    # 6. Check file size
    # --------------------------------------------------

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size must not exceed 5 MB",
        )

    # --------------------------------------------------
    # 7. Validate actual image using Pillow
    # --------------------------------------------------

    try:
        validated_image = Image.open(BytesIO(contents))
        validated_image.verify()

    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image",
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image",
        )

    # --------------------------------------------------
    # 8. Re-open image for processing
    # --------------------------------------------------

    try:
        image: Image.Image = Image.open(BytesIO(contents))

        # Correct image orientation using EXIF metadata
        image = ImageOps.exif_transpose(image)

        # Convert unsupported image modes
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")

        # Resize while maintaining aspect ratio
        image.thumbnail(MAX_IMAGE_SIZE)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to process image",
        )

    # --------------------------------------------------
    # 9. Generate unique filename
    # --------------------------------------------------

    unique_filename = f"{uuid4()}{file_extension}"

    file_path = UPLOAD_DIR / unique_filename

    # --------------------------------------------------
    # 10. Save processed image
    # --------------------------------------------------

    try:
        if file_extension in {".jpg", ".jpeg"}:
            if image.mode == "RGBA":
                image = image.convert("RGB")

            image.save(
                file_path,
                format="JPEG",
                quality=85,
                optimize=True,
            )

        elif file_extension == ".png":
            image.save(
                file_path,
                format="PNG",
                optimize=True,
            )

        elif file_extension == ".webp":
            image.save(
                file_path,
                format="WEBP",
                quality=85,
            )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to save processed image",
        )

    # --------------------------------------------------
    # 11. Create notification
    # --------------------------------------------------

    notification = {
        "event": "file_uploaded",
        "filename": unique_filename,
        "original_filename": file.filename,
        "message": "A new image was uploaded successfully",
    }

    # --------------------------------------------------
    # 12. Broadcast notification
    # --------------------------------------------------

    await manager.broadcast(notification)

    # --------------------------------------------------
    # 13. Return API response
    # --------------------------------------------------

    return {
        "message": "Image uploaded successfully",
        "original_filename": file.filename,
        "stored_filename": unique_filename,
        "content_type": file.content_type,
        "original_size_bytes": file_size,
        "image_size": {
            "width": image.width,
            "height": image.height,
        },
        "url": f"/uploads/{unique_filename}",
    }
