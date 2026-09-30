from datetime import datetime
from pydantic import BaseModel,ConfigDict
class AttachmentResponse(BaseModel):
    id:int;task_id:int;original_name:str;content_type:str;file_url:str;created_at:datetime
    model_config=ConfigDict(from_attributes=True)
