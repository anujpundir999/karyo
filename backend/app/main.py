from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from app.db.session import engine
import logging

from app.api import auth
from app.api import project
from app.api import task
from fastapi.middleware.cors import CORSMiddleware
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


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(auth.router)
app.include_router(project.router)
app.include_router(task.router)
