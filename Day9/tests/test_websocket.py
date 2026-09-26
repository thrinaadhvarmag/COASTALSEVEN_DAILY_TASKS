from io import BytesIO

from PIL import Image


def create_test_image():
    image = Image.new(
        "RGB",
        (100, 100),
        color="blue",
    )

    image_bytes = BytesIO()

    image.save(
        image_bytes,
        format="PNG",
    )

    image_bytes.seek(0)

    return image_bytes.getvalue()


def test_websocket_connection(client):
    with client.websocket_connect("/ws/notifications") as websocket:

        websocket.send_text("Hello FastAPI")

        response = websocket.receive_text()

        assert response == ("Server received: Hello FastAPI")


def test_file_upload_broadcasts_notification(client):
    """
    Verify that a successful file upload sends
    a real-time notification to connected clients.
    """

    image_content = create_test_image()

    # Connect WebSocket client
    with client.websocket_connect("/ws/notifications") as websocket:

        # Upload an image
        response = client.post(
            "/files/upload",
            files={
                "file": (
                    "integration_test.png",
                    image_content,
                    "image/png",
                )
            },
        )

        # Verify upload succeeded
        assert response.status_code == 200

        upload_data = response.json()

        assert upload_data["message"] == ("Image uploaded successfully")

        # Receive broadcast notification
        notification = websocket.receive_json()

        # Verify notification
        assert notification["event"] == "file_uploaded"

        assert notification["original_filename"] == ("integration_test.png")

        assert notification["message"] == ("A new image was uploaded successfully")

        assert "filename" in notification
