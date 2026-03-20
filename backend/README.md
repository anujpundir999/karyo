# Karyo Backend

FastAPI service for Karyo.

It handles authentication, project membership, and task management, and it now ships with a layered regression test setup (`unit`, `integration`, `regression`) so API behavior is easier to evolve without accidental breakage.

## What This Service Covers

- User auth (`signup`, `login`, `refresh`, `logout`)
- Project CRUD-adjacent flows used by the app (`create`, `list`, `members`, `add-member`)
- Task flows (`create`, `list by project`, `update status`)
- JWT + refresh-token based auth checks on protected routes

## Stack

- Python 3.13
- FastAPI
- SQLAlchemy (async)
- Alembic (migrations)
- Redis (token blocklist/JTI)
- Pytest + pytest-cov
- `uv` for dependency management and command execution

## Quick Start

From `backend/`:

```bash
uv sync
```

Create `.env` in `backend/` and set required variables.

Run migrations:

```bash
uv run alembic upgrade head
```

Start the API:

```bash
uv run uvicorn app.main:app --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## Environment Variables

Required by `app/core/config.py`:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRY`

Optional (defaults exist):

- `REDIS_HOST` (default: `localhost`)
- `REDIS_PORT` (default: `6379`)
- `JTI_EXPIRY` (default: `3600`)

Minimal local example:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/karyo
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRY=7
REDIS_HOST=localhost
REDIS_PORT=6379
JTI_EXPIRY=3600
```

## API Surface

Routes are mounted in `app/main.py`.

Auth (`/auth`):

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Projects (`/projects`):

- `POST /projects/`
- `GET /projects/`
- `POST /projects/{project_id}/add-member`
- `GET /projects/{project_id}/members`

Tasks (`/tasks`):

- `POST /tasks/projects/{project_id}`
- `GET /tasks/projects/{project_id}`
- `PATCH /tasks/{task_id}/status`

## Testing

Test suites live under `backend/tests/` and are split by scope.

```text
tests/
	unit/
	integration/
	regression/
	conftest.py
```

Run all tests:

```bash
pytest
```

Run only regression tests:

```bash
pytest tests/regression -q
```

Coverage note:

- Coverage is already enabled via `pyproject.toml` (`addopts = "--cov=app --cov-report=term-missing"`)
- So plain `pytest` prints coverage output

For testing conventions and examples, see `backend/tests/README.md`.

## CI

Backend tests run in GitHub Actions via:

- `.github/workflows/backend-tests.yml`

The workflow runs on backend-related pushes/PRs and executes the same pytest flow used locally.

## Repo Layout (Backend)

```text
backend/
	app/
		api/          # FastAPI route modules
		core/         # config + security helpers
		db/           # session/engine setup
		models/       # SQLAlchemy models
		repositories/ # data access layer
		schemas/      # request/response schemas
		services/     # business logic
	alembic/
	tests/
	pyproject.toml
```

## Notes For Contributors

- Keep route handlers thin; put behavior in `services/`
- Add regression tests for bug fixes and auth/permission edge cases
- Prefer deterministic fixtures over cross-test shared state
- If you change response contracts, update both `schemas/` and integration tests in the same PR

