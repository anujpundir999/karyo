import uuid
import jwt
from datetime import datetime, timedelta, timezone
from app.core.config import settings

def create_access_token(
    user_data: dict, expiry: timedelta = None, refresh: bool = False
) -> str:
    payload = {}

    payload["user"] = user_data
    expire = datetime.now(timezone.utc) + (
        expiry if expiry is not None else timedelta(seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    )
    payload["exp"] = expire
    payload["jti"] = str(uuid.uuid4())
    payload["refresh"] = refresh

    token = jwt.encode(
        payload=payload,
        key=settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    
    return token


def decode_token(token: str) -> dict:
    try:
        token_data = jwt.decode(
            jwt=token,
            key=settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return token_data
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")