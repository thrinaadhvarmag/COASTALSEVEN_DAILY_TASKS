from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    profile_image_url: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
