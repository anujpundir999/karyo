from app.repositories.user import UserRepository
from app.models.user import User
from app.schemas.user import UserCreateSchema
from app.core.security.hashing import hash_password


class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def create_user(self, data: UserCreateSchema) -> User:
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise ValueError("Email already registered")
        if len(data.password) < 8:
            raise ValueError("Password must be at least 8 characters")

        user = User(
            email=data.email,
            username=data.username,
            password_hash=hash_password(data.password),
        )

        await self.repo.create(user)

        return user
