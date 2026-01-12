from app.core.security.bearer import AccessTokenBearer
from fastapi import Depends
from app.db.session import get_db
from app.repositories.user import UserRepository


repo = UserRepository(db=Depends(get_db))

access_token_bearer = AccessTokenBearer()

async def get_current_user(token_data: dict = Depends(access_token_bearer)):
    user_email = token_data["user"]["email"]
    user = await repo.get_by_email(user_email)
    return user