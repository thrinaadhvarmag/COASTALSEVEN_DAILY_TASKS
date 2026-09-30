from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from api.database import Base

class TaskAttachment(Base):
    __tablename__="task_attachments"
    id=Column(Integer,primary_key=True,index=True)
    task_id=Column(Integer,ForeignKey("tasks.id",ondelete="CASCADE"),nullable=False,index=True)
    original_name=Column(String(255),nullable=False)
    stored_name=Column(String(255),nullable=False,unique=True)
    content_type=Column(String(100),nullable=False)
    file_url=Column(String(500),nullable=False)
    created_at=Column(DateTime,default=datetime.utcnow,nullable=False)
    task=relationship("Task",back_populates="attachments")
