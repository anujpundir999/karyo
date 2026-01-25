from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.project import ProjectCreateSchema,ProjectResponseSchema,ProjectUpdateSchema,ProjectMemberAddSchema
from app.services.project import ProjectService
from app.repositories.project import ProjectRepository
from app.repositories.user import UserRepository
from app.core.security.dependencies import get_current_user
from app.models.user import User
from typing import List

router = APIRouter(prefix="/projects",tags=["projects"])

@router.post("/",response_model=ProjectResponseSchema,status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data:ProjectCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user : User = Depends(get_current_user),
):
    service = ProjectService(db)

    project = await service.create_project_for_user(
        project_data,
        current_user
    )

    return project

@router.get("/",response_model=List[ProjectResponseSchema],status_code=status.HTTP_200_OK)
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user : User = Depends(get_current_user)
):
    service = ProjectService(db)

    projects = await service.list_projects_for_user(
        current_user
    )
    return projects

@router.post(
    "/{project_id}/add-member",
    status_code=status.HTTP_201_CREATED,
    summary="Add a member to a project",
)
async def add_member_to_project(
    project_id:str,
    member_data:ProjectMemberAddSchema,
    db: AsyncSession = Depends(get_db),
    current_user : User = Depends(get_current_user),
):
    service = ProjectService(db)

    project_member = await service.add_member_to_project(
        project_id,
        member_data.email,
        current_user
    )
    return project_member