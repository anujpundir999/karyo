from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.task import TaskRepository
from app.repositories.project import ProjectRepository
from fastapi import HTTPException, status

class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.project_repository = ProjectRepository(db)
        self.task_repository = TaskRepository(db)
    
    async def create_task(self,TaskData,project_id,user_id):
        is_member = await self.project_repository.is_user_project_member(
            project_id,
            user_id=user_id
        )
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this project",
            )


        task = await self.task_repository.create_task(TaskData,project_id)
        await self.db.commit()
        return task
    
    async def get_tasks_for_project(self,project_id,user_id):
        is_member = await self.project_repository.is_user_project_member(
            project_id,
            user_id=user_id
        )
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this project",
            )
        
        return await self.task_repository.get_tasks_for_project(project_id)
    
    async def update_task_status(self,task_id,status,user_id):
        task = await self.task_repository.get_task_by_id(task_id)

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task with the provided ID does not exist.",
            )
        
        is_member = await self.project_repository.is_user_project_member(
            task.project_id,
            user_id=user_id
        )

        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this project",
            )
        
        await self.task_repository.update_task_status(task,status)
        await self.db.commit()

        return task
    
