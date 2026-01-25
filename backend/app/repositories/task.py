from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.task import Task

class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_task(self,TaskData,project_id)->Task:
        task = Task(
            project_id = project_id,
            title = TaskData.title,
            description = TaskData.description,
            assigned_to = TaskData.assigned_to,
            due_date = TaskData.due_date,
        )

        self.db.add(task)
        await self.db.flush()
        await self.db.refresh(task)
        return task

    async def get_tasks_for_project(self,project_id)->list[Task]:
        result = await self.db.execute(
            select(Task).where(Task.project_id == project_id)
        )
        return result.scalars().all()
    
    async def get_task_by_id(self,task_id)->Task|None:
        result = await self.db.execute(
            select(Task).where(Task.id == task_id)
        )
        return result.scalar_one_or_none()
    
    async def update_task_status(self,task:Task,status:str)->Task:
        task.status = status
        self.db.add(task)
        await self.db.flush()
        await self.db.refresh(task)
        return task