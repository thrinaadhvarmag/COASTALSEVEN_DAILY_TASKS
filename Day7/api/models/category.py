from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from api.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)

    tasks = relationship("Task", back_populates="category")