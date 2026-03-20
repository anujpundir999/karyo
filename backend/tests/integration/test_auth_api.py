from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi import HTTPException

from app.api import auth


def test_signup_returns_201_and_user_payload(client, override_db, monkeypatch):
    fake_user = SimpleNamespace(
        id=uuid4(),
        email="new@example.com",
        username="new_user",
        created_at=datetime.now(timezone.utc),
    )

    create_user = AsyncMock(return_value=fake_user)
    monkeypatch.setattr(auth.UserService, "create_user", create_user)

    response = client.post(
        "/auth/signup",
        json={"email": "new@example.com", "username": "new_user", "password": "password123"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["email"] == "new@example.com"
    assert payload["username"] == "new_user"
    override_db.commit.assert_awaited_once()


def test_signup_duplicate_email_rolls_back_and_returns_400(client, override_db, monkeypatch):
    create_user = AsyncMock(side_effect=ValueError("Email already registered"))
    monkeypatch.setattr(auth.UserService, "create_user", create_user)

    response = client.post(
        "/auth/signup",
        json={"email": "existing@example.com", "username": "existing_user", "password": "password123"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"
    override_db.rollback.assert_awaited_once()


def test_login_success_returns_tokens_and_user(client, override_db, monkeypatch):
    login_user = AsyncMock(
        return_value={
            "access_token": "a-token",
            "refresh_token": "r-token",
            "user": {"email": "u@example.com", "user_id": str(uuid4())},
        }
    )
    monkeypatch.setattr(auth.UserService, "login_user", login_user)

    response = client.post(
        "/auth/login",
        json={"email": "u@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Login successful."
    assert "access_token" in body
    assert "refresh_token" in body


def test_login_propagates_http_exception(client, override_db, monkeypatch):
    login_user = AsyncMock(
        side_effect=HTTPException(status_code=401, detail="Invalid credentials.")
    )
    monkeypatch.setattr(auth.UserService, "login_user", login_user)

    response = client.post(
        "/auth/login",
        json={"email": "u@example.com", "password": "wrongpass123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials."


def test_refresh_returns_new_access_token(client, monkeypatch, token_details):
    async def _override_refresh_dep():
        return token_details

    app = auth.router
    from app.main import app as fastapi_app

    fastapi_app.dependency_overrides[auth.refresh_token_bearer] = _override_refresh_dep
    monkeypatch.setattr(auth.UserService, "get_new_access_token", AsyncMock(return_value="new-access"))

    try:
        response = client.post("/auth/refresh")
    finally:
        fastapi_app.dependency_overrides.pop(auth.refresh_token_bearer, None)

    assert response.status_code == 200
    assert response.json()["access_token"] == "new-access"


def test_logout_blacklists_jti_and_returns_200(client, monkeypatch, token_details):
    async def _override_refresh_dep():
        return token_details

    from app.main import app as fastapi_app

    fastapi_app.dependency_overrides[auth.refresh_token_bearer] = _override_refresh_dep
    add_blocklist = AsyncMock()
    monkeypatch.setattr("app.api.auth.add_jti_to_blocklist", add_blocklist)

    try:
        response = client.post("/auth/logout")
    finally:
        fastapi_app.dependency_overrides.pop(auth.refresh_token_bearer, None)

    assert response.status_code == 200
    assert response.json()["message"] == "User logged out successfully."
    add_blocklist.assert_awaited_once_with(token_details["jti"])
