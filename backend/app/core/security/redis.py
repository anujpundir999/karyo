import redis.asyncio as redis
from app.core.config import settings


token_blocklist = redis.Redis(
    host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0, decode_responses=True
)


async def add_jti_to_blocklist(jti: str) -> None:
    await token_blocklist.setex(name=jti, time=settings.JTI_EXPIRY, value="")


async def is_jti_blacklisted(jti: str) -> bool:
    jti_value = await token_blocklist.get(jti)
    return jti_value is not None

