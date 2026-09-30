from datetime import datetime
from pydantic import BaseModel,ConfigDict,Field
class ChecklistCreate(BaseModel):
    title:str=Field(...,min_length=1,max_length=200)
    position:int=Field(default=0,ge=0)
class ChecklistUpdate(BaseModel):
    title:str|None=Field(default=None,min_length=1,max_length=200)
    completed:bool|None=None
    position:int|None=Field(default=None,ge=0)
class ChecklistResponse(BaseModel):
    id:int;task_id:int;title:str;completed:bool;position:int;created_at:datetime
    model_config=ConfigDict(from_attributes=True)
