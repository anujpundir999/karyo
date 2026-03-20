# Karyo MVP Frontend

Frontend for the Karyo project management app.

This client handles:
- authentication flows (`/login`, `/signup`)
- protected app shell (`/dashboard`, `/projects/...`)
- project listing and creation
- project detail with Kanban board and team management

Tech stack: Next.js App Router, React, TypeScript, Tailwind CSS v4, Axios, React Hook Form, Zod.

## 1. Quick Start

From `frontend/`:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Home route (`/`) redirects to `/login`.

## 2. Environment

Create `.env.local` in `frontend/`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Notes:
- If `NEXT_PUBLIC_API_URL` is missing, the client still defaults to `http://localhost:8000`.
- Backend is expected to expose auth/project/task APIs used by this frontend.

## 3. Scripts

```bash
npm run dev      # Start local dev server
npm run build    # Production build
npm run start    # Run production build
```

## 4. Route Map

Public routes:
- `/login`
- `/signup`

Protected routes:
- `/dashboard`
- `/projects`
- `/projects/new`
- `/projects/[id]`

Behavior:
- Unauthenticated users are redirected to `/login` by `middleware.ts`.
- If an authenticated user opens `/login` or `/signup`, they are redirected to `/dashboard`.

## 5. Auth + Session Flow

- Access and refresh tokens are stored in cookies via `lib/auth.ts`.
- `lib/api.ts` adds `Authorization: Bearer <access_token>` on requests.
- On `401`, the client attempts token refresh using `/auth/refresh`.
- If refresh fails, tokens are cleared and user is sent back to `/login`.

This gives a mostly seamless session experience during token expiry.

## 6. Frontend Structure

```text
app/
	layout.tsx             Root layout + metadata + global styles
	page.tsx               Redirects to /login
	login/page.tsx         Login form
	signup/page.tsx        Signup form
	dashboard/             Protected dashboard pages/layout
	projects/              Project list, create, and detail pages

components/
	Sidebar.tsx            App navigation + logout
	kanban/                Board, columns, cards, create-task modal

lib/
	api.ts                 Axios instance + auth interceptors
	auth.ts                Cookie token helpers

types/
	index.ts               Shared API/domain types
```

## 7. Key UI Flows

Login:
- form validation with Zod + React Hook Form
- submits to `/auth/login`
- stores tokens
- routes to `/dashboard`

Project detail:
- loads project, tasks, and members
- board tab supports drag/drop status updates with optimistic UI
- team tab allows owner to add members by email
- new task modal supports assignee, status, due date

## 8. Common Gotchas

- Token cookie names must stay aligned with backend expectations:
	- `access_token`
	- `refresh_token`
- If redirects feel wrong, check JWT `exp` format and server clock drift.
- If requests fail in browser but not in curl/Postman, verify CORS config on backend.

## 9. Next Improvements

- Add lint and format scripts (`next lint`, Prettier)
- Add tests (Playwright for flows, React Testing Library for components)
- Add empty/error states for all async pages consistently

---

