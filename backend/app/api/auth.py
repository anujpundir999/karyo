from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.user import UserCreateSchema, UserLoginSchema, UserResponseSchema
from app.services.user import UserService
from app.repositories.user import UserRepository
from app.core.security.bearer import RefreshTokenBearer
from app.core.security.redis import add_jti_to_blocklist

refresh_token_bearer = RefreshTokenBearer()

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

@router.post("/login", summary="User login and token generation")
async def login(user_data: UserLoginSchema, db=Depends(get_db)):
    repo = UserRepository(db)
    service = UserService(repo)
    result = await service.login_user(user_data, db)

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Login successful.",
            **result,
        },
    )

@router.post(
    "/refresh", summary="Generate new access token using refresh token"
)
async def get_new_access_token(token_details: dict = Depends(refresh_token_bearer)):
    service = UserService()
    new_access_token = await service.get_new_access_token(token_details)

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "New access token generated successfully.",
            "access_token": new_access_token,
        },
    )

@router.post("/logout", summary="Logout user by blacklisting their token")
async def logout_user(token_details: dict = Depends(refresh_token_bearer)):
    jti = token_details["jti"]
    print(jti)
    await add_jti_to_blocklist(jti)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "User logged out successfully."},
    )
