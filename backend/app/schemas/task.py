from pydantic import BaseModel, Field
from uuid import UUID
from datetime import date,datetime
from typing import Literal

class TaskCreate(BaseModel):
    title:str
    description:str | None = None
    assigned_to: UUID | None = None
    due_date:date | None = None

class TaskResponse(BaseModel):
    id:UUID
    title:str
    description:str | None
    status:str
    project_id:UUID
    assigned_to:UUID | None
    due_date: date | None
    created_at : datetime

    class Config:
        from_attributes = True

class TaskUpdateStatus(BaseModel):
    status: Literal["TODO", "IN_PROGRESS", "DONE"]
