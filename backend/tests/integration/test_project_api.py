from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi import HTTPException

from app.api import project


def test_create_project_returns_201(client, override_db, override_current_user, monkeypatch):
    created_project = SimpleNamespace(
        id=uuid4(),
        name="Alpha",
        description="First project",
        owner_id=override_current_user.id,
        created_at=datetime.now(timezone.utc),
    )
    monkeypatch.setattr(
        project.ProjectService,
        "create_project_for_user",
        AsyncMock(return_value=created_project),
    )

    response = client.post("/projects/", json={"name": "Alpha", "description": "First project"})

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Alpha"
    assert body["description"] == "First project"


def test_list_projects_returns_array(client, override_db, override_current_user, monkeypatch):
    projects = [
        SimpleNamespace(
            id=uuid4(),
            name="Alpha",
            description=None,
            owner_id=override_current_user.id,
            created_at=datetime.now(timezone.utc),
        )
    ]
    monkeypatch.setattr(project.ProjectService, "list_projects_for_user", AsyncMock(return_value=projects))

    response = client.get("/projects/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert response.json()[0]["name"] == "Alpha"


def test_add_member_returns_403_when_non_owner(client, override_db, override_current_user, monkeypatch):
    monkeypatch.setattr(
        project.ProjectService,
        "add_member_to_project",
        AsyncMock(side_effect=HTTPException(status_code=403, detail="Only project owners can add members to the project.")),
    )

    response = client.post(
        f"/projects/{uuid4()}/add-member",
        json={"email": "member@example.com"},
    )

    assert response.status_code == 403
    assert "Only project owners" in response.json()["detail"]


def test_get_members_of_project_returns_typed_payload(client, override_db, override_current_user, monkeypatch):
    members = [
        {
            "id": uuid4(),
            "user_id": uuid4(),
            "username": "memberuser",
            "email": "member@example.com",
            "project_id": uuid4(),
            "role": "MEMBER",
            "joined_at": datetime.now(timezone.utc),
        }
    ]
    monkeypatch.setattr(project.ProjectService, "get_members_of_project", AsyncMock(return_value=members))

    response = client.get(f"/projects/{uuid4()}/members")

    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["username"] == "memberuser"
    assert payload[0]["role"] == "MEMBER"
