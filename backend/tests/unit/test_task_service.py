import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services.task import TaskService


def run(coro):
    return asyncio.run(coro)


def build_service() -> TaskService:
    service = TaskService(AsyncMock())
    service.project_repository = AsyncMock()
    service.task_repository = AsyncMock()
    service.db = AsyncMock()
    service.db.commit = AsyncMock()
    return service


def test_create_task_forbidden_when_user_not_project_member():
    service = build_service()
    service.project_repository.is_user_project_member.return_value = None

    with pytest.raises(HTTPException) as exc:
        run(service.create_task(SimpleNamespace(title="x"), str(uuid4()), str(uuid4())))

    assert exc.value.status_code == 403


def test_create_task_success_commits():
    service = build_service()
    task = SimpleNamespace(id=uuid4(), title="Task")
    service.project_repository.is_user_project_member.return_value = SimpleNamespace(role="MEMBER")
    service.task_repository.create_task.return_value = task

    result = run(service.create_task(SimpleNamespace(title="Task"), str(uuid4()), str(uuid4())))

    assert result == task
    service.db.commit.assert_awaited_once()


def test_get_tasks_for_project_forbidden_when_not_member():
    service = build_service()
    service.project_repository.is_user_project_member.return_value = None

    with pytest.raises(HTTPException) as exc:
        run(service.get_tasks_for_project(str(uuid4()), str(uuid4())))

    assert exc.value.status_code == 403


def test_update_task_status_returns_404_for_missing_task():
    service = build_service()
    service.task_repository.get_task_by_id.return_value = None

    with pytest.raises(HTTPException) as exc:
        run(service.update_task_status(str(uuid4()), "DONE", str(uuid4())))

    assert exc.value.status_code == 404


def test_update_task_status_returns_403_for_non_member():
    service = build_service()
    task = SimpleNamespace(id=uuid4(), project_id=uuid4(), status="TODO")
    service.task_repository.get_task_by_id.return_value = task
    service.project_repository.is_user_project_member.return_value = None

    with pytest.raises(HTTPException) as exc:
        run(service.update_task_status(str(task.id), "DONE", str(uuid4())))

    assert exc.value.status_code == 403


def test_update_task_status_success_updates_and_commits():
    service = build_service()
    task = SimpleNamespace(id=uuid4(), project_id=uuid4(), status="TODO")
    service.task_repository.get_task_by_id.return_value = task
    service.project_repository.is_user_project_member.return_value = SimpleNamespace(role="MEMBER")

    result = run(service.update_task_status(str(task.id), "DONE", str(uuid4())))

    assert result == task
    service.task_repository.update_task_status.assert_awaited_once_with(task, "DONE")
    service.db.commit.assert_awaited_once()
