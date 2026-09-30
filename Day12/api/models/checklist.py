from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from api.database import Base

class ChecklistItem(Base):
    __tablename__="task_checklist_items"
    id=Column(Integer,primary_key=True,index=True)
    task_id=Column(Integer,ForeignKey("tasks.id",ondelete="CASCADE"),nullable=False,index=True)
    title=Column(String(200),nullable=False)
    completed=Column(Boolean,default=False,nullable=False)
    position=Column(Integer,default=0,nullable=False)
    created_at=Column(DateTime,default=datetime.utcnow,nullable=False)
    task=relationship("Task",back_populates="checklist_items")
