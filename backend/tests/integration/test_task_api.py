from datetime import datetime, date, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi import HTTPException

from app.api import task


def test_create_task_for_project_returns_201(client, override_db, override_current_user, monkeypatch):
    created_task = SimpleNamespace(
        id=uuid4(),
        title="Write docs",
        description="Add API docs",
        status="TODO",
        project_id=uuid4(),
        assigned_to=None,
        due_date=date.today(),
        created_at=datetime.now(timezone.utc),
    )
    monkeypatch.setattr(task.TaskService, "create_task", AsyncMock(return_value=created_task))

    response = client.post(
        f"/tasks/projects/{created_task.project_id}",
        json={
            "title": "Write docs",
            "description": "Add API docs",
            "assigned_to": None,
            "due_date": str(date.today()),
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Write docs"
    assert body["status"] == "TODO"


def test_create_task_for_project_rejects_invalid_uuid(client, override_db, override_current_user):
    response = client.post(
        f"/tasks/projects/{uuid4()}",
        json={
            "title": "Bad task",
            "assigned_to": "not-a-uuid",
            "due_date": None,
        },
    )

    assert response.status_code == 422


def test_get_tasks_for_project_returns_list(client, override_db, override_current_user, monkeypatch):
    tasks = [
        SimpleNamespace(
            id=uuid4(),
            title="Task 1",
            description=None,
            status="IN_PROGRESS",
            project_id=uuid4(),
            assigned_to=None,
            due_date=None,
            created_at=datetime.now(timezone.utc),
        )
    ]
    monkeypatch.setattr(task.TaskService, "get_tasks_for_project", AsyncMock(return_value=tasks))

    response = client.get(f"/tasks/projects/{uuid4()}")

    assert response.status_code == 200
    assert response.json()[0]["status"] == "IN_PROGRESS"


def test_update_task_status_returns_404_when_missing(client, override_db, override_current_user, monkeypatch):
    monkeypatch.setattr(
        task.TaskService,
        "update_task_status",
        AsyncMock(side_effect=HTTPException(status_code=404, detail="Task with the provided ID does not exist.")),
    )

    response = client.patch(f"/tasks/{uuid4()}/status", json={"status": "DONE"})

    assert response.status_code == 404


def test_update_task_status_rejects_invalid_status_literal(client, override_db, override_current_user):
    response = client.patch(f"/tasks/{uuid4()}/status", json={"status": "BLOCKED"})

    assert response.status_code == 422
