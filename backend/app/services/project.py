from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreateSchema
from app.models.user import User
from app.repositories.user import UserRepository
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

class ProjectService:
    def __init__(self,db:AsyncSession):
        self.repo = ProjectRepository(db)
        self.user_repo = UserRepository(db)
        self.db = db
    
    async def create_project_for_user(
            self,
            project_details:ProjectCreateSchema,
            current_user:User
    ):
        project = await self.repo.create_project(project_details.name,project_details.description,current_user.id)
        
        await self.repo.add_member_to_project(
            user_id=current_user.id,
            project_id=project.id,
            role = "OWNER",
        )

        await self.db.commit()
        return project
    
    async def add_member_to_project(
            self,
            project_id,
            user_email:str,
            current_user: User,
    ):
        is_member = await self.repo.is_user_project_member(
            project_id,
            current_user.id
        )

        print("is_member--->",is_member)

        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this project",
            )
        
        if is_member.role != "OWNER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only project owners can add members to the project.",
            )

        
        #get user by email
        user_to_add = await self.user_repo.get_by_email(user_email)
        if not user_to_add:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User with the provided email does not exist.",
            )
        
        already_member = await self.repo.is_user_project_member(
            project_id,
            user_to_add.id
        )

        if already_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of the project.",
            )
        
        project_member = await self.repo.add_member_to_project(
            user_to_add.id,
            project_id,
            role="MEMBER"
        )

        await self.db.commit()

        return project_member
    async def list_projects_for_user(
            self,
            current_user:User
    ):
        projects = await self.repo.get_projects_by_user(
            current_user.id
        )
        return projects
    
    async def get_members_of_project(
            self,
            project_id,
            user_id
    ):
        is_member = await self.repo.is_user_project_member(
            project_id,
            user_id
        )
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this project",
            )
        members = await self.repo.get_project_members(project_id)
        return members
