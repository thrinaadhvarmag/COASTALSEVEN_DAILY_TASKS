from typing import Callable

from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.routers.auth import get_current_user


def require_role(required_role: str) -> Callable:

    def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:

        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )

        return current_user

    return role_checker