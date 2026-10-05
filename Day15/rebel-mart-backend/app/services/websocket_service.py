from collections import defaultdict

from fastapi import WebSocket


class WebSocketManager:

    def __init__(self):
        self.connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(
        self,
        user_id: int,
        websocket: WebSocket,
    ) -> None:

        await websocket.accept()

        self.connections[user_id].add(websocket)

    def disconnect(
        self,
        user_id: int,
        websocket: WebSocket,
    ) -> None:

        if user_id not in self.connections:
            return

        self.connections[user_id].discard(websocket)

        if not self.connections[user_id]:
            del self.connections[user_id]

    async def send_to_user(
        self,
        user_id: int,
        message: dict,
    ) -> None:

        connections = self.connections.get(user_id, set())

        disconnected = set()

        for websocket in connections:

            try:
                await websocket.send_json(message)

            except Exception:
                disconnected.add(websocket)

        for websocket in disconnected:
            self.disconnect(user_id, websocket)

    async def send_order_status(
        self,
        user_id: int,
        order_id: int,
        status: str,
    ) -> None:

        message = {
            "event": "order_status_update",
            "order_id": order_id,
            "status": status,
        }

        await self.send_to_user(
            user_id=user_id,
            message=message,
        )


websocket_manager = WebSocketManager()