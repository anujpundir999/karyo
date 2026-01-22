from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreateSchema
from app.models.user import User
from app.repositories.user import UserRepository

class ProjectService:
    def __init__(self, repo: ProjectRepository,user_repo:UserRepository):
        self.repo = repo
        self.user_repo = user_repo
    
    async def create_project_for_user(
            self,
            project_details:ProjectCreateSchema,
            current_user:User
    ):
        project = await self.repo.create_project(project_details.name,project_details.description,current_user.id)
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

        if not is_member:
            raise ValueError("Current user is not a member of the project which means they are not authorized to add new members.")
        
        #get user by email
        user_to_add = await self.user_repo.get_by_email(user_email)
        if not user_to_add:
            raise ValueError("User with the provided email does not exist.")
        
        already_member = await self.repo.is_user_project_member(
            project_id,
            user_to_add.id
        )

        if already_member:
            raise ValueError("User is already a member of the project.")
        
        project_member = await self.repo.add_member_to_project(
            user_to_add.id,
            project_id,
            role="MEMBER"
        )

        return project_member
