from io import BytesIO

from PIL import Image


def create_test_image():
    """
    Create a real valid PNG image in memory.
    """
    image = Image.new(
        "RGB",
        (100, 100),
        color="red",
    )

    image_bytes = BytesIO()

    image.save(
        image_bytes,
        format="PNG",
    )

    image_bytes.seek(0)

    return image_bytes.getvalue()


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200

    assert response.json() == {"status": "healthy"}


def test_root(client):
    response = client.get("/")

    assert response.status_code == 200

    assert response.json() == {"message": "FastAPI Advanced Project is running"}


def test_upload_valid_image(client):
    image_content = create_test_image()

    response = client.post(
        "/files/upload",
        files={
            "file": (
                "test.png",
                image_content,
                "image/png",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Image uploaded successfully"
    assert data["original_filename"] == "test.png"
    assert data["content_type"] == "image/png"

    assert "stored_filename" in data
    assert "url" in data
    assert "image_size" in data

    assert data["image_size"]["width"] == 100
    assert data["image_size"]["height"] == 100


def test_upload_invalid_content_type(client):
    response = client.post(
        "/files/upload",
        files={
            "file": (
                "test.pdf",
                b"fake pdf content",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 400

    assert response.json()["detail"] == (
        "Invalid file type. " "Only JPEG, PNG and WEBP images are allowed."
    )


def test_upload_invalid_extension(client):
    response = client.post(
        "/files/upload",
        files={
            "file": (
                "test.gif",
                b"fake image data",
                "image/gif",
            )
        },
    )

    assert response.status_code == 400


def test_upload_empty_file(client):
    response = client.post(
        "/files/upload",
        files={
            "file": (
                "empty.png",
                b"",
                "image/png",
            )
        },
    )

    assert response.status_code == 400

    assert response.json()["detail"] == ("Uploaded file is empty")


def test_upload_fake_image(client):
    response = client.post(
        "/files/upload",
        files={
            "file": (
                "fake.png",
                b"This is not a real image",
                "image/png",
            )
        },
    )

    assert response.status_code == 400

    assert response.json()["detail"] == ("Uploaded file is not a valid image")
