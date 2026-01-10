from datetime import datetime
from pydantic import BaseModel, EmailStr,Field
from uuid import UUID

class UserCreateSchema(BaseModel):
    email: EmailStr = Field(..., description="The user's email address")
    username: str = Field(..., min_length=6,max_length=30,description="The user's username")
    password: str = Field(...,min_length=8,max_length=128,description="The user's password")


class UserLoginSchema(BaseModel):
    email: EmailStr = Field(..., description="The user's email address")
    password: str = Field(...,min_length=8,max_length=128,description="The user's password")

class UserResponseSchema(BaseModel):
    id: UUID = Field(..., description="The user's unique identifier")
    email: EmailStr = Field(..., description="The user's email address")
    username: str = Field(..., min_length=6,max_length=30,description="The user's username")
    created_at: datetime = Field(..., description="The timestamp when the user was created")

    class Config:
        from_attributes = True