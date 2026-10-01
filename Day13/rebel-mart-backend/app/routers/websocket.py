from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jwt import InvalidTokenError

from app.core.security import decode_access_token
from app.services.websocket_service import websocket_manager

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/orders/{user_id}")
async def order_status_websocket(websocket: WebSocket, user_id: int):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return
    try:
        token_user_id = decode_access_token(token)
    except (InvalidTokenError, ValueError, TypeError):
        await websocket.close(code=1008, reason="Invalid or expired token")
        return
    if token_user_id != user_id:
        await websocket.close(code=1008, reason="Not authorized")
        return

    await websocket_manager.connect(user_id=user_id, websocket=websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(user_id=user_id, websocket=websocket)
