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

class ProjectMemberResponseSchema(BaseModel):
    id : UUID = Field(...,description="Unique identifier of the membership")
    user_id : UUID = Field(...,description="Unique identifier of the user")
    username : str = Field(...,description="Username of the member")
    email : str = Field(...,description="Email of the member")
    project_id : UUID = Field(...,description="Unique identifier of the project")
    role : str = Field(...,description="Role of the member in the project")
    joined_at : datetime = Field(...,description="Timestamp when the member joined")

    class Config:
        from_attributes = True