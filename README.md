# TimeOff - Vacation Management App

A full-stack vacation request management application. Two roles exist: **Requesters** submit vacation requests, and **Validators** review, approve, or reject them.

---

## Tech Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Frontend | Vue 3 + Vite + TypeScript + PrimeVue (Aura theme) |
| Backend  | Node.js + Express + TypeScript                    |
| Database | PostgreSQL + TypeORM                              |
| Auth     | JWT in httpOnly + SameSite=Strict cookies         |
| Tests    | Vitest - backend integration + frontend unit/connection |

---

## Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher (must be running locally)

---

## Installation & Setup

### 1. Backend

```bash
cd backend
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Open `backend/.env` and set:
- `DB_USERNAME` - your PostgreSQL username
- `DB_PASSWORD` - your PostgreSQL password
- `JWT_SECRET` - any long random string (e.g. `openssl rand -hex 32`)

Create the database (tables are created automatically on first run via `synchronize: true`):

```bash
npm run setup-db
```

This connects using the credentials in your `.env` file and creates the database if it doesn't already exist. Safe to re-run - it does nothing if the database is already there.

Start the development server:

```bash
npm run dev
```

Backend runs at **http://localhost:3000**. Verify with:

```bash
curl http://localhost:3000/api/health
# → { "success": true, "data": { "status": "ok" } }
```

---

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**. The backend must be running for API calls to work.

---

### 3. Seed Data (optional but recommended)

Populates the database with 10 validators, 100 requesters, and ~200–300 vacation requests across mixed statuses:

```bash
cd backend
npm run seed
```

> **Warning:** Re-running seed wipes all existing data and starts fresh.

Pre-seeded accounts you can log in with immediately:

| Role      | Names                                                         |
|-----------|---------------------------------------------------------------|
| Validator | `Morgan`, `Jordan`, `Taylor`, `Casey`, `Riley`, `Quinn`, `Avery`, `Blake`, `Cameron`, `Drew` |
| Requester | `Alex 1` through `Alex 100`                                   |

---

## Running Tests

### Backend

Tests run against a separate `timeoff_test` database - your real data is never touched.

Create the test database once:

```bash
npm run setup-db:test
```

Run the tests:

```bash
cd backend
npm test
```

Covered:
- `authService` - register (success, duplicate name), login (found, not found)
- `vacationService` - submit, approve, reject, self-approval block, overlap detection, 404/409 guards
- `vacationValidators` - date format, date order, missing fields, empty rejection comment

### Frontend

```bash
cd frontend
npm test
```

Covered:
- `VacationForm` - missing dates error, end-before-start error, valid submission shape with trimmed reason
- `useAuthStore` - login sets user, logout clears user, fetchMe on error clears user
- `useVacations` - correct endpoint and payload for every API call (GET, POST, PATCH), loading flag resets on error
- `api interceptor` - 401 redirects to /login and clears user, other errors pass through without redirect
- `router guards` - unauthenticated redirects to /login, wrong-role redirects to /403, logged-in user redirected away from /login and / to their dashboard

---

## API Reference

All responses follow a consistent envelope:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": "...", "details": [...] }
```

### Auth - `/api/auth`

| Method | Path        | Auth | Description                             |
|--------|-------------|------|-----------------------------------------|
| POST   | `/register` | -    | Create account, set session cookie      |
| POST   | `/login`    | -    | Authenticate by name, set session cookie |
| POST   | `/logout`   | -    | Clear session cookie                    |
| GET    | `/me`       | JWT  | Return current user from token          |

### Vacations - `/api/vacations`

| Method | Path             | Role      | Description                                   |
|--------|------------------|-----------|-----------------------------------------------|
| POST   | `/`              | Requester | Submit a new vacation request                 |
| GET    | `/me`            | Requester | List own requests (all statuses)              |
| GET    | `/`              | Validator | List all requests; optional `?status=` filter |
| PATCH  | `/:id/approve`   | Validator | Approve a request                             |
| PATCH  | `/:id/reject`    | Validator | Reject a request (comment required)           |

---

## Technical Decisions

### Name-only authentication (no passwords)
Users register and log in by name only - no password. This is a deliberate simplification for a recruitment exercise context where the focus is on architecture and feature completeness rather than credential management. The session mechanism itself (JWT in an httpOnly, SameSite=Strict cookie) is production-quality.

### JWT in httpOnly cookie (not localStorage)
Storing the token in an httpOnly cookie prevents JavaScript from reading it, eliminating XSS-based token theft. SameSite=Strict blocks the token from being sent on cross-site requests, mitigating CSRF without needing a separate CSRF token.

### `synchronize: true` throughout
TypeORM's `synchronize: true` auto-creates and updates the database schema on startup. This removes the need for migration files in a local-only development context and keeps the feedback loop fast. It is intentionally NOT safe for production - a real deployment would switch to explicit migrations.

### No frontend pagination
The vacation list uses a scrollable DataTable rather than paginated pages. For the scale of this app (~300 seeded requests) this is appropriate, avoids unnecessary complexity, and provides a smoother user experience.

### Overlapping Pending requests are allowed
If a user submits two requests for overlapping dates and both are Pending, no error is raised - a Validator can decide how to handle it. Only overlapping **Approved** requests are blocked (409 Conflict), since two approved periods for the same person would be a data integrity issue.

### Past dates are allowed
A requester can submit a request with a start date in the past. Retroactive requests are a valid business scenario (e.g. documenting an unplanned absence after the fact).

### Validator dashboard sorted by `updatedAt`, not `createdAt`
The validator's request table shows a "Last Updated" column and sorts by `updatedAt` descending. This means recently actioned requests (approved or rejected) stay near the top, making it easy to review recent decisions. Sorting by submission date (`createdAt`) would bury those records and force a validator to scroll past already-handled requests to find the latest activity. Requesters, on the other hand, see their own list sorted by `createdAt` since they care about the order they submitted, not when the status last changed.

### Circular dependency resolved with dynamic import
The Axios instance (`api/index.ts`) needs to redirect to `/login` on a 401 response, which requires the router. The router guard imports the Pinia auth store, which imports the Axios instance. This circular chain is broken by using a dynamic `import('@/stores/auth')` inside the interceptor function body, so it only resolves at call time rather than at module load time.

---

## Extra Features

Features added beyond the assignment requirements.

### Authentication pages (Login & Register)
The assignment did not specify user management - only that two roles exist. Rather than hardcoding a user or passing an ID in the URL, a proper login and register flow was added so each person can create their own account and sign in by name. This makes the app feel complete and realistic, and gives the role-based routing something meaningful to protect.

### Infinite scroll on the validator dashboard
The validator table loads 50 requests at a time instead of fetching everything in one query. As the validator scrolls down, once they are within 50 rows of the bottom the next page is automatically appended. The backend accepts `limit` and `offset` query params (capped at 100 per request) and the frontend tracks the current offset and a `hasMore` flag so no extra fetch is made once the last page has been reached. Changing the status filter resets to page one.

### Real-time updates with Socket.io
When a requester submits a new vacation request, all connected validators see the table refresh and receive a toast with the requester's name and the requested dates - no manual refresh needed. When a validator approves or rejects a request, the relevant requester's table updates instantly and they receive a toast showing the outcome and the validator's comment if rejected. The socket connection is authenticated using the same JWT cookie already in the browser, so no extra login step is needed. The server emits to targeted rooms (`user:{id}` for personal notifications, `role:Validator` for broadcast to all validators) so each user only receives events relevant to them.

### Delete pending requests
Requesters can delete any of their own vacation requests as long as the status is still Pending. Once a validator has acted on a request (Approved or Rejected) it becomes read-only, since removing it would silently erase the validator's recorded decision. The delete button appears in the request detail dialog with a one-step inline confirmation to prevent accidental deletions.

### Search by requester name on the validator dashboard
A search bar in the validator dashboard header lets validators filter requests by requester name. The query fires only after the user stops typing for 500ms (debounce) to avoid a request on every keystroke. The filter is case-insensitive and partial (typing "ali" matches "Alice"), works alongside the status filter, and resets to page one on each new search. The name filter is carried through to subsequent infinite-scroll pages so the full result set for a given search is reachable by scrolling.

---

## Known Limitations

- **No password authentication** - anyone who knows (or guesses) a registered name can log in as that user. This is acceptable for a demo/recruitment context but not for production.
- **No token refresh** - the JWT expires after 24 hours. There is no refresh token mechanism; users must log in again after expiry.
- **`synchronize: true` in production would be dangerous** - schema changes are applied automatically on startup, which can cause data loss on destructive changes (e.g. dropping a column).
- **No email notifications** - validators and requesters receive no notification when a request status changes; they must check the dashboard manually.
- **No pagination on the validator dashboard** - all requests load in a single query. At very large scale (tens of thousands of requests) this would need server-side pagination.
- **CORS is open in development** - the backend allows requests from any origin in the current configuration. A production deployment would restrict this to the known frontend origin.
