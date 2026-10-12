"""
Development-only admin bootstrap.

Run from the ecommerce-backend directory with the backend virtualenv active:

    python path/to/create_admin.py

Edit ADMIN_EMAIL and ADMIN_PASSWORD before running.

This script uses the existing User model and password hashing from the backend.
It does not change database schemas.
"""

import sys
from pathlib import Path

# Make the backend package importable when this script is copied into
# the backend project's scripts/ directory.
BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

ADMIN_EMAIL = "admin@example.com"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "AdminPass@12345"


def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()

        if user:
            user.username = ADMIN_USERNAME
            user.hashed_password = hash_password(ADMIN_PASSWORD)
            user.role = "admin"
        else:
            user = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                hashed_password=hash_password(ADMIN_PASSWORD),
                role="admin",
            )
            db.add(user)

        db.commit()
        db.refresh(user)

        print("Admin account ready:")
        print(f"  email:    {user.email}")
        print(f"  username: {user.username}")
        print(f"  role:     {user.role}")
        print("  password: value configured in this script")

    finally:
        db.close()


if __name__ == "__main__":
    main()
