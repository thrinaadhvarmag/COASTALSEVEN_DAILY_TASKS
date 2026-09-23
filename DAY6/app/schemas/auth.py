from pydantic import BaseModel, EmailStr, Field


# ============================================================
# REGISTER REQUEST
# ============================================================

class RegisterRequest(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=100
    )


# ============================================================
# REFRESH TOKEN REQUEST
# ============================================================

class RefreshRequest(BaseModel):

    refresh_token: str