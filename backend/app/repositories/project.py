from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User


class ProjectRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_project(self,name:str,description:str|None,owner_id) -> Project:
        project = Project(name=name, description=description, owner_id=owner_id)
        self.db.add(project)
        await self.db.flush()
        return project
    
    async def get_projects_by_user(self,user_id)->list[Project]:
        result = await self.db.execute(
            select(Project).distinct().join(ProjectMember).where(ProjectMember.user_id == user_id)
        )
        return result.scalars().all()
    
    async def get_projects_by_id(self,project_id)->Project|None : 
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def delete_project(self,project:Project)->None:
        await self.db.delete(project)
        await self.db.flush()

    async def update_project(self,project:Project,name:str|None,description:str|None)->Project:
        if name is not None:
            project.name = name
        if description is not None:
            project.description = description
        self.db.add(project)
        await self.db.flush()
        return project
    
    async def add_member_to_project(self, user_id, project_id, role:str)->ProjectMember:
        member = ProjectMember(user_id=user_id,project_id=project_id,role=role,)
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def is_user_project_member(self,project_id,user_id)->ProjectMember|None:
        result = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id
            )
        )
        return result.scalar_one_or_none()
    
    async def get_project_members(self, project_id) -> list:
        result = await self.db.execute(
            select(
                ProjectMember.id,
                ProjectMember.user_id,
                ProjectMember.project_id,
                ProjectMember.role,
                ProjectMember.joined_at,
                User.username,
                User.email,
            ).join(User, ProjectMember.user_id == User.id)
             .where(ProjectMember.project_id == project_id)
        )
        rows = result.mappings().all()
        return [dict(r) for r in rows]

