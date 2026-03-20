import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.schemas.user import UserCreateSchema, UserLoginSchema
from app.services.user import UserService


def run(coro):
    return asyncio.run(coro)


def test_create_user_raises_when_email_already_registered():
    repo = AsyncMock()
    repo.get_by_email.return_value = SimpleNamespace(id=uuid4())
    service = UserService(repo)

    with pytest.raises(ValueError, match="Email already registered"):
        run(
            service.create_user(
                UserCreateSchema(
                    email="existing@example.com",
                    username="existinguser",
                    password="password123",
                )
            )
        )


def test_create_user_hashes_password_and_persists(monkeypatch):
    repo = AsyncMock()
    repo.get_by_email.return_value = None
    service = UserService(repo)

    monkeypatch.setattr("app.services.user.hash_password", lambda _: "hashed-value")

    created = run(
        service.create_user(
            UserCreateSchema(
                email="new@example.com",
                username="new_user",
                password="password123",
            )
        )
    )

    assert created.email == "new@example.com"
    assert created.password_hash == "hashed-value"
    repo.create.assert_awaited_once()


@pytest.mark.parametrize(
    "repo_user, password, verifier_result, expected_status",
    [
        (None, "password123", None, 404),
        (SimpleNamespace(id=uuid4(), email="u@example.com", password_hash="h"), "badpass123", False, 401),
    ],
)
def test_login_user_error_paths(repo_user, password, verifier_result, expected_status, monkeypatch):
    repo = AsyncMock()
    repo.get_by_email.return_value = repo_user
    service = UserService(repo)

    if verifier_result is not None:
        monkeypatch.setattr("app.services.user.verify_password", lambda *_: verifier_result)

    with pytest.raises(HTTPException) as exc:
        run(
            service.login_user(
                UserLoginSchema(email="u@example.com", password=password),
                db=AsyncMock(),
            )
        )

    assert exc.value.status_code == expected_status


def test_login_user_success_returns_access_and_refresh_tokens(monkeypatch):
    user = SimpleNamespace(id=uuid4(), email="ok@example.com", password_hash="hashed")
    repo = AsyncMock()
    repo.get_by_email.return_value = user
    service = UserService(repo)

    monkeypatch.setattr("app.services.user.verify_password", lambda *_: True)

    tokens = iter(["access-token", "refresh-token"])
    monkeypatch.setattr("app.services.user.create_access_token", lambda **_: next(tokens))

    result = run(
        service.login_user(
            UserLoginSchema(email="ok@example.com", password="password123"),
            db=AsyncMock(),
        )
    )

    assert result["access_token"] == "access-token"
    assert result["refresh_token"] == "refresh-token"
    assert result["user"]["email"] == "ok@example.com"


def test_get_new_access_token_raises_for_expired_refresh_token():
    service = UserService()
    expired = int((datetime.now(timezone.utc) - timedelta(minutes=1)).timestamp())

    with pytest.raises(HTTPException) as exc:
        run(
            service.get_new_access_token(
                {
                    "exp": expired,
                    "user": {"email": "x@example.com", "user_id": str(uuid4())},
                }
            )
        )

    assert exc.value.status_code == 403


def test_get_new_access_token_returns_new_access_token(monkeypatch):
    service = UserService()
    future_exp = int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp())

    monkeypatch.setattr("app.services.user.create_access_token", lambda **_: "new-access")

    result = run(
        service.get_new_access_token(
            {
                "exp": future_exp,
                "user": {"email": "x@example.com", "user_id": str(uuid4())},
            }
        )
    )

    assert result == "new-access"
