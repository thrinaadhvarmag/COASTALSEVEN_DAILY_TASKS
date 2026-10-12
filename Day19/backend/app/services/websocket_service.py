from collections import defaultdict
from typing import Hashable

from fastapi import WebSocket


class WebSocketManager:
    """In-memory WebSocket connection manager for real-time application events."""

    def __init__(self) -> None:
        self.rooms: dict[Hashable, set[WebSocket]] = defaultdict(set)

    async def connect(self, room: Hashable, websocket: WebSocket) -> None:
        await websocket.accept()
        self.rooms[room].add(websocket)

    def disconnect(self, room: Hashable, websocket: WebSocket) -> None:
        connections = self.rooms.get(room)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            self.rooms.pop(room, None)

    async def send_to_room(self, room: Hashable, message: dict) -> None:
        connections = set(self.rooms.get(room, set()))
        disconnected: set[WebSocket] = set()

        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.add(websocket)

        for websocket in disconnected:
            self.disconnect(room, websocket)

    async def send_to_user(self, user_id: int, message: dict) -> None:
        await self.send_to_room(f"user:{user_id}", message)

    async def send_order_status(self, user_id: int, order_id: int, status: str) -> None:
        await self.send_to_user(
            user_id,
            {
                "event": "order_status_update",
                "order_id": order_id,
                "status": status,
            },
        )

    async def send_chat_message(self, customer_id: int, message: dict) -> None:
        await self.send_to_room(f"chat:{customer_id}", message)


websocket_manager = WebSocketManager()
