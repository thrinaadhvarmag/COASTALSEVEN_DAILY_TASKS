from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter,Depends,File,HTTPException,UploadFile
from sqlalchemy.orm import Session
from api.database import get_db
from api.models.task import Task
from api.models.user import User
from api.models.checklist import ChecklistItem
from api.models.task_attachment import TaskAttachment
from api.schemas.checklist import ChecklistCreate,ChecklistUpdate,ChecklistResponse
from api.schemas.attachment import AttachmentResponse
from api.security import get_current_user
router=APIRouter(prefix="/tasks",tags=["Task Extras"])
UPLOAD_DIR=Path(__file__).resolve().parents[1]/"uploads";UPLOAD_DIR.mkdir(parents=True,exist_ok=True)
ALLOWED_TYPES={"image/jpeg","image/png","image/webp","application/pdf"};MAX_BYTES=5*1024*1024
def owned_task(task_id,current_user,db):
    q=db.query(Task).filter(Task.id==task_id)
    if current_user.role!="admin":q=q.filter(Task.assignee_id==current_user.id)
    task=q.first()
    if not task:raise HTTPException(status_code=404,detail="Task not found")
    return task
@router.post("/{task_id}/checklist",response_model=ChecklistResponse,status_code=201)
def create_checklist(task_id:int,data:ChecklistCreate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    owned_task(task_id,current_user,db);item=ChecklistItem(task_id=task_id,title=data.title,position=data.position);db.add(item);db.commit();db.refresh(item);return item
@router.get("/{task_id}/checklist",response_model=list[ChecklistResponse])
def get_checklist(task_id:int,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    owned_task(task_id,current_user,db);return db.query(ChecklistItem).filter(ChecklistItem.task_id==task_id).order_by(ChecklistItem.position,ChecklistItem.id).all()
@router.patch("/{task_id}/checklist/{item_id}",response_model=ChecklistResponse)
def update_checklist(task_id:int,item_id:int,data:ChecklistUpdate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    owned_task(task_id,current_user,db);item=db.query(ChecklistItem).filter(ChecklistItem.id==item_id,ChecklistItem.task_id==task_id).first()
    if not item:raise HTTPException(status_code=404,detail="Checklist item not found")
    for field,value in data.model_dump(exclude_unset=True).items():setattr(item,field,value)
    db.commit();db.refresh(item);return item
@router.delete("/{task_id}/checklist/{item_id}",status_code=204)
def delete_checklist(task_id:int,item_id:int,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    owned_task(task_id,current_user,db);item=db.query(ChecklistItem).filter(ChecklistItem.id==item_id,ChecklistItem.task_id==task_id).first()
    if not item:raise HTTPException(status_code=404,detail="Checklist item not found")
    db.delete(item);db.commit()
@router.post("/{task_id}/attachments",response_model=AttachmentResponse,status_code=201)
async def upload_attachment(task_id:int,file:UploadFile=File(...),db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    owned_task(task_id,current_user,db)
    if file.content_type not in ALLOWED_TYPES:raise HTTPException(status_code=400,detail="Only JPG, PNG, WEBP images or PDF files are allowed")
    content=await file.read(MAX_BYTES+1)
    if len(content)>MAX_BYTES:raise HTTPException(status_code=413,detail="File must be 5 MB or smaller")
    suffix=Path(file.filename or "upload").suffix.lower() or ".bin";stored=f"{uuid4().hex}{suffix}";(UPLOAD_DIR/stored).write_bytes(content)
    item=TaskAttachment(task_id=task_id,original_name=file.filename or stored,stored_name=stored,content_type=file.content_type,file_url=f"/uploads/{stored}");db.add(item);db.commit();db.refresh(item);return item
@router.get("/{task_id}/attachments",response_model=list[AttachmentResponse])
def get_attachments(task_id:int,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    owned_task(task_id,current_user,db);return db.query(TaskAttachment).filter(TaskAttachment.task_id==task_id).order_by(TaskAttachment.id.desc()).all()
