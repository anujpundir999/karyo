from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from fastapi.params import Depends
from app.repositories.user import UserRepository
from app.models.user import User
from app.schemas.user import UserCreateSchema,UserLoginSchema
from app.core.security.hashing import hash_password,verify_password
from app.core.security.jwt import create_access_token
from app.db.session import get_db
from starlette import status
from app.core.config import settings
from app.core.security.bearer import RefreshTokenBearer


refresh_token_bearer = RefreshTokenBearer()


class UserService:
    def __init__(self, repo: UserRepository = None):
        self.repo = repo

    async def create_user(self, data: UserCreateSchema) -> User:
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise ValueError("Email already registered")

        existing_username = await self.repo.get_by_username(data.username)
        if existing_username:
            raise ValueError("Username already registered")

        if len(data.password) < 8:
            raise ValueError("Password must be at least 8 characters")

        user = User(
            email=data.email,
            username=data.username,
            password_hash=hash_password(data.password),
        )

        await self.repo.create(user)

        return user
    
    async def login_user(self, user_data:UserLoginSchema, db=Depends(get_db)):
        email = user_data.email
        password = user_data.password

        user = await self.repo.get_by_email(email)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User with this email does not exist.",
            )

        password_valid = verify_password(password, user.password_hash)
        if not password_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.",
            )

        access_token = create_access_token(
            user_data={"email": user.email, "user_id": str(user.id)},
        )
        refresh_token = create_access_token(
            user_data={
                "email": user.email,
                "user_id": str(user.id),
            },
            expiry=timedelta(days=settings.REFRESH_TOKEN_EXPIRY),
            refresh=True,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "email": user.email,
                "user_id": str(user.id),
            }
        }

    async def get_new_access_token(self, token_details: dict = Depends(refresh_token_bearer)):
        expiry_date = token_details["exp"]

        print(token_details)

        if datetime.fromtimestamp(expiry_date, tz=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Refresh token has expired. Please log in again.",
            )
        
        new_access_token = create_access_token(user_data=token_details["user"])
        return new_access_token