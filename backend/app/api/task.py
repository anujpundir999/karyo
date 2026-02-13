from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security.dependencies import get_current_user
from app.schemas.task import TaskCreate,TaskResponse,TaskUpdateStatus
from app.models.user import User
from app.services.task import TaskService
from typing import List

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
)

@router.post(
    "/projects/{project_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task_for_project(
    project_id: str,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_service = TaskService(db)
    task = await task_service.create_task(task_data, project_id, current_user.id)
    return task

@router.get(
    "/projects/{project_id}",
    response_model=List[TaskResponse],
)
async def get_tasks_for_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_service = TaskService(db)
    tasks = await task_service.get_tasks_for_project(project_id, current_user.id)
    return tasks

@router.patch(
    "/{task_id}/status",
    response_model=TaskResponse,
)
async def update_task_status(
    task_id: str,
    status_data: TaskUpdateStatus,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_service = TaskService(db)
    task = await task_service.update_task_status(task_id, status_data.status, current_user.id)
    return task