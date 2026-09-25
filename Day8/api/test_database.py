from sqlalchemy import text

from database import SessionLocal


db = SessionLocal()

try:
    result = db.execute(text("SELECT 1"))
    print("Database connection successful!")
    print(result.scalar())
finally:
    db.close()