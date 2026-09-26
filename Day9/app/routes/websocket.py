from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(
    prefix="/ws",
    tags=["WebSockets"],
)


class ConnectionManager:
    """
    Manages all active WebSocket connections.
    """

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """
        Accept a new WebSocket connection
        and add it to the active connections list.
        """
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection.
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(
        self,
        message: str,
        websocket: WebSocket,
    ):
        """
        Send a message to one specific client.
        """
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        """
        Send a JSON message to all connected clients.
        """

        disconnected_connections = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)

            except Exception:
                disconnected_connections.append(connection)

        # Remove connections that are no longer active
        for connection in disconnected_connections:
            self.disconnect(connection)


manager = ConnectionManager()


@router.websocket("/notifications")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time notifications.
    """

    await manager.connect(websocket)

    try:
        while True:
            message = await websocket.receive_text()

            await manager.send_personal_message(
                f"Server received: {message}",
                websocket,
            )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
