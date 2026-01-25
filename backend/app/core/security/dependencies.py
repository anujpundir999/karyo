from app.core.security.bearer import AccessTokenBearer
from fastapi import Depends, HTTPException, status
from app.db.session import get_db
from app.repositories.user import UserRepository
from sqlalchemy.ext.asyncio import AsyncSession


access_token_bearer = AccessTokenBearer()

async def get_current_user(token_data: dict = Depends(access_token_bearer),
                           db:AsyncSession=Depends(get_db)):
    repo = UserRepository(db)
    user_email = token_data["user"]["email"]
    if not user_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = await repo.get_by_email(user_email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user