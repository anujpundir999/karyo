from uuid import uuid4

import pytest

from app.core.security.dependencies import get_current_user
from app.main import app


def test_signup_validation_rejects_short_username(client, override_db):
    response = client.post(
        "/auth/signup",
        json={"email": "u@example.com", "username": "abc", "password": "password123"},
    )

    assert response.status_code == 422


def test_login_validation_rejects_short_password(client, override_db):
    response = client.post(
        "/auth/login",
        json={"email": "u@example.com", "password": "short"},
    )

    assert response.status_code == 422


@pytest.mark.xfail(reason="Invalid JWT currently raises ValueError inside bearer and can surface as 500.")
def test_invalid_bearer_token_on_protected_route_returns_403(client, override_db):
    app.dependency_overrides.pop(get_current_user, None)

    response = client.get(
        "/projects/",
        headers={"Authorization": "Bearer definitely-not-a-jwt"},
    )

    assert response.status_code == 403
