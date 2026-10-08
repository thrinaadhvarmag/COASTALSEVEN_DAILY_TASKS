from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime

from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.routers.auth import get_current_user
from app.database import get_db
from app.models.chat_message import ChatMessage
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    sender_id: int
    sender_role: str
    text: str
    created_at: datetime


@router.get("/{customer_id}/messages", response_model=list[ChatMessageResponse])
def get_chat_messages(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ChatMessageResponse]:
    if current_user.role != "admin" and current_user.id != customer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    rows = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.customer_id == customer_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
    ).all()

    return [
        ChatMessageResponse(
            id=row.id,
            customer_id=row.customer_id,
            sender_id=row.sender_id,
            sender_role=row.sender_role,
            text=row.text,
            created_at=row.created_at,
        )
        for row in rows
    ]
