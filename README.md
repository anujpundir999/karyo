# Karyo

Karyo is a full-stack project management app built with a Next.js frontend and a FastAPI backend.

Current MVP supports auth, project membership, and Kanban-style task tracking.

## What You Get Today

- Signup/login with JWT access + refresh flow
- Project creation and project listing
- Team membership management per project
- Task board with `TODO`, `IN_PROGRESS`, and `DONE`
- Backend regression-focused test suite (`unit`, `integration`, `regression`)

## Tech Stack

Frontend:
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Axios, React Hook Form, Zod

Backend:
- FastAPI
- SQLAlchemy (async)
- Alembic
- PostgreSQL (`asyncpg`)
- Redis (token blocklist/JTI)
- Pytest + pytest-cov

## Repository Layout

```text
karyo/
	backend/
		app/
		alembic/
		tests/
		pyproject.toml
	frontend/
		app/
		components/
		lib/
		package.json
	.github/workflows/
```

## Local Development

### 1. Start Dependencies

You need:
- PostgreSQL
- Redis

Use local services, Docker, or your preferred setup.

### 2. Run Backend

From `backend/`:

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Backend runs on `http://127.0.0.1:8000` by default.

Health check:

```bash
curl http://127.0.0.1:8000/health
```

### 3. Run Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Environment Configuration

### Backend (`backend/.env`)

Required:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRY`

Optional:

- `REDIS_HOST` (default `localhost`)
- `REDIS_PORT` (default `6379`)
- `JTI_EXPIRY` (default `3600`)

Example:

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

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Overview

Auth:
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Projects:
- `POST /projects/`
- `GET /projects/`
- `POST /projects/{project_id}/add-member`
- `GET /projects/{project_id}/members`

Tasks:
- `POST /tasks/projects/{project_id}`
- `GET /tasks/projects/{project_id}`
- `PATCH /tasks/{task_id}/status`

## Testing

Backend tests are organized by scope:

```text
backend/tests/
	unit/
	integration/
	regression/
	conftest.py
```

From `backend/`:

```bash
pytest
pytest tests/regression -q
```

Coverage is enabled by default via `backend/pyproject.toml`, so plain `pytest` prints coverage output.

## CI

Backend test workflow:
- `.github/workflows/backend-tests.yml`

It runs on backend-related PRs/pushes and executes tests with coverage.

## Working Agreement (for contributors)

- Keep route handlers thin; business rules go in `backend/app/services/`
- If API behavior changes, update integration tests in the same PR
- Add regression tests for bug fixes and auth/permission edge cases
- Keep tests deterministic and fixture-driven

## Current Status

MVP is actively evolving. Core flows are stable enough for iterative feature work, and test scaffolding is in place to keep future changes safe.