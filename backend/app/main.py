from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from app.db.session import engine
import logging

logger = logging.getLogger("uvicorn")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("lifespan started")
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    logger.info("Database connection established")
    yield
    logger.info("Application shutdown")

app = FastAPI(title="Karyo API",lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok"}
