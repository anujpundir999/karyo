from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.user import UserCreateSchema, UserResponseSchema
from app.services.user import UserService
from app.repositories.user import UserRepository

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/signup",
    response_model=UserResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
async def signup(
    user_data:UserCreateSchema,
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    service = UserService(repo)
    try:
        user = await service.create_user(user_data)
        await db.commit()
        return user
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

