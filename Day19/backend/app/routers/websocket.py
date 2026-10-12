import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jwt import InvalidTokenError

from app.core.security import decode_access_token
from app.database import SessionLocal
from app.models.user import User
from app.models.chat_message import ChatMessage
from app.services.websocket_service import websocket_manager

router = APIRouter(tags=["WebSocket"])


def _authenticate(websocket: WebSocket) -> int | None:
    token = websocket.query_params.get("token")
    if not token:
        return None
    try:
        return decode_access_token(token)
    except (InvalidTokenError, ValueError, TypeError):
        return None


@router.websocket("/ws/orders/{user_id}")
async def order_status_websocket(websocket: WebSocket, user_id: int) -> None:
    token_user_id = _authenticate(websocket)
    if token_user_id != user_id:
        await websocket.close(code=1008, reason="Not authorized")
        return

    room = f"user:{user_id}"
    await websocket_manager.connect(room, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(room, websocket)


@router.websocket("/ws/chat/{customer_id}")
async def customer_chat_websocket(websocket: WebSocket, customer_id: int) -> None:
    """Real-time customer/admin chat.

    Customers may only join their own room. Admins may join any customer room.
    The JWT remains the source of authorization for the WebSocket connection.
    """
    token_user_id = _authenticate(websocket)
    if token_user_id is None:
        await websocket.close(code=1008, reason="Authentication required")
        return

    with SessionLocal() as db:
        user = db.get(User, token_user_id)
        if user is None or (user.role != "admin" and token_user_id != customer_id):
            await websocket.close(code=1008, reason="Not authorized")
            return

    room = f"chat:{customer_id}"
    await websocket_manager.connect(room, websocket)
    try:
        while True:
            raw_message = await websocket.receive_text()
            try:
                payload = json.loads(raw_message)
            except json.JSONDecodeError:
                await websocket.send_json({"event": "chat_error", "message": "Invalid JSON message"})
                continue

            if payload.get("type") != "chat_message":
                continue

            text = str(payload.get("text", "")).strip()
            if not text or len(text) > 1000:
                await websocket.send_json(
                    {"event": "chat_error", "message": "Message must contain 1-1000 characters"}
                )
                continue

            with SessionLocal() as db:
                stored = ChatMessage(
                    customer_id=customer_id,
                    sender_id=token_user_id,
                    sender_role=user.role,
                    text=text,
                )
                db.add(stored)
                db.commit()
                db.refresh(stored)
                message = {
                    "event": "chat_message",
                    "id": stored.id,
                    "customer_id": stored.customer_id,
                    "sender_id": stored.sender_id,
                    "sender_role": stored.sender_role,
                    "text": stored.text,
                    "created_at": stored.created_at.isoformat(),
                }
            await websocket_manager.send_chat_message(customer_id, message)

            # Admin messages also travel through the always-connected user room so
            # the customer receives a notification even when the chat panel is closed.
            if user.role == "admin":
                await websocket_manager.send_to_user(
                    customer_id,
                    {
                        "event": "chat_notification",
                        "message_id": stored.id,
                        "customer_id": customer_id,
                        "sender_id": token_user_id,
                        "sender_role": user.role,
                        "text": stored.text,
                        "created_at": stored.created_at.isoformat(),
                    },
                )
    except WebSocketDisconnect:
        websocket_manager.disconnect(room, websocket)
