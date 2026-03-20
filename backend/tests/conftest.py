import os
import sys
from collections.abc import AsyncGenerator, Iterator
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

# Ensure required settings exist before app imports settings at module load.
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("REFRESH_TOKEN_EXPIRY", "7")
os.environ.setdefault("REDIS_HOST", "localhost")
os.environ.setdefault("REDIS_PORT", "6379")
os.environ.setdefault("JTI_EXPIRY", "3600")

# Make sure `backend/app` is importable when tests run from different CWDs.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.security.dependencies import get_current_user
from app.db.session import get_db
from app.main import app
from app.models.user import User


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_session_mock() -> AsyncMock:
    session = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return session


@pytest.fixture
def override_db(db_session_mock: AsyncMock) -> Iterator[AsyncMock]:
    async def _fake_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield db_session_mock

    app.dependency_overrides[get_db] = _fake_get_db
    yield db_session_mock
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def current_user() -> User:
    return User(
        id=uuid4(),
        email="owner@example.com",
        username="owneruser",
        password_hash="hashed",
        created_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def override_current_user(current_user: User) -> Iterator[User]:
    async def _fake_current_user() -> User:
        return current_user

    app.dependency_overrides[get_current_user] = _fake_current_user
    yield current_user
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def token_details() -> dict[str, Any]:
    return {
        "user": {"email": "owner@example.com", "user_id": str(uuid4())},
        "exp": int(datetime.now(timezone.utc).timestamp()) + 3600,
        "jti": "test-jti",
        "refresh": True,
    }
