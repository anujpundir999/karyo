import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.schemas.project import ProjectCreateSchema
from app.services.project import ProjectService


def run(coro):
    return asyncio.run(coro)


def build_service() -> ProjectService:
    service = ProjectService(AsyncMock())
    service.repo = AsyncMock()
    service.user_repo = AsyncMock()
    service.db = AsyncMock()
    service.db.commit = AsyncMock()
    return service


def test_create_project_for_user_creates_owner_membership():
    service = build_service()
    current_user = SimpleNamespace(id=uuid4())
    project = SimpleNamespace(id=uuid4(), name="Roadmap")
    service.repo.create_project.return_value = project

    result = run(
        service.create_project_for_user(
            ProjectCreateSchema(name="Roadmap", description="Q3 scope"),
            current_user,
        )
    )

    assert result == project
    service.repo.add_member_to_project.assert_awaited_once_with(
        user_id=current_user.id,
        project_id=project.id,
        role="OWNER",
    )
    service.db.commit.assert_awaited_once()


@pytest.mark.parametrize(
    "membership, expected_status, expected_detail",
    [
        (None, 403, "You are not a member of this project"),
        (SimpleNamespace(role="MEMBER"), 403, "Only project owners can add members to the project."),
    ],
)
def test_add_member_to_project_enforces_membership_and_owner(membership, expected_status, expected_detail):
    service = build_service()
    current_user = SimpleNamespace(id=uuid4())
    service.repo.is_user_project_member.return_value = membership

    with pytest.raises(HTTPException) as exc:
        run(service.add_member_to_project(str(uuid4()), "new@example.com", current_user))

    assert exc.value.status_code == expected_status
    assert exc.value.detail == expected_detail


def test_add_member_to_project_raises_when_user_email_not_found():
    service = build_service()
    project_id = str(uuid4())
    current_user = SimpleNamespace(id=uuid4())
    service.repo.is_user_project_member.return_value = SimpleNamespace(role="OWNER")
    service.user_repo.get_by_email.return_value = None

    with pytest.raises(HTTPException) as exc:
        run(service.add_member_to_project(project_id, "missing@example.com", current_user))

    assert exc.value.status_code == 404


def test_add_member_to_project_raises_when_already_member():
    service = build_service()
    project_id = str(uuid4())
    current_user = SimpleNamespace(id=uuid4())
    user_to_add = SimpleNamespace(id=uuid4())
    service.repo.is_user_project_member.side_effect = [
        SimpleNamespace(role="OWNER"),
        SimpleNamespace(role="MEMBER"),
    ]
    service.user_repo.get_by_email.return_value = user_to_add

    with pytest.raises(HTTPException) as exc:
        run(service.add_member_to_project(project_id, "user@example.com", current_user))

    assert exc.value.status_code == 400


def test_add_member_to_project_success_commits_and_returns_membership():
    service = build_service()
    project_id = str(uuid4())
    current_user = SimpleNamespace(id=uuid4())
    user_to_add = SimpleNamespace(id=uuid4())
    created_member = SimpleNamespace(id=uuid4(), project_id=project_id)

    service.repo.is_user_project_member.side_effect = [SimpleNamespace(role="OWNER"), None]
    service.user_repo.get_by_email.return_value = user_to_add
    service.repo.add_member_to_project.return_value = created_member

    result = run(service.add_member_to_project(project_id, "user@example.com", current_user))

    assert result == created_member
    service.repo.add_member_to_project.assert_awaited_once_with(
        user_to_add.id,
        project_id,
        role="MEMBER",
    )
    service.db.commit.assert_awaited_once()


def test_get_members_of_project_forbidden_for_non_member():
    service = build_service()
    service.repo.is_user_project_member.return_value = None

    with pytest.raises(HTTPException) as exc:
        run(service.get_members_of_project(str(uuid4()), str(uuid4())))

    assert exc.value.status_code == 403
