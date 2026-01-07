from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass


from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.task import Task