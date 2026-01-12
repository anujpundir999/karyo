from datetime import datetime
from pydantic import BaseModel, EmailStr,Field
from uuid import UUID

class ProjectCreateSchema(BaseModel):
    name : str = Field(...,min_length=3,max_length=100,description="Name of the project")
    description : str | None = Field(None,description="Description of the project")

class ProjectResponseSchema(BaseModel):
    id : UUID = Field(...,description="Unique identifier of the project")
    name : str = Field(...,description="Name of the project")
    description : str | None = Field(None,description="Description of the project")
    owner_id : UUID = Field(...,description="Unique identifier of the project owner")
    created_at : datetime = Field(...,description="Timestamp when the project was created")

    class Config:
        from_attributes = True

class ProjectUpdateSchema(BaseModel):
    name : str | None = Field(None,description="Name of the project")
    description : str | None = Field(None,description="Description of the project")

class ProjectMemberAddSchema(BaseModel):
    email : EmailStr = Field(...,description="Email of the user to be added as a project member")