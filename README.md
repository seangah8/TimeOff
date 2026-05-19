# TimeOff — Vacation Management App

A full-stack vacation request management application built with Vue 3, Node.js, PostgreSQL, and TypeORM.

## Roles

- **Requester** — submits and tracks vacation requests
- **Validator** — reviews, approves, or rejects requests

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | Vue 3 + Vite + TypeScript + PrimeVue    |
| Backend  | Node.js + Express + TypeScript          |
| Database | PostgreSQL + TypeORM                    |
| Auth     | JWT via httpOnly cookies (no passwords) |
| Tests    | Vitest (integration tests)              |

---

## Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher (must be running locally)

---

## Backend Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set at minimum:
- `DB_PASSWORD` — your PostgreSQL password
- `JWT_SECRET` — any long random string (e.g. `openssl rand -hex 32`)

### 3. Create the database

Connect to PostgreSQL and create the app database:

```bash
psql -U postgres -c "CREATE DATABASE timeoff;"
```

> On Windows you may need to set the password first:
> `$env:PGPASSWORD="your_password"` (PowerShell) or use pgAdmin.

Table creation happens automatically when the server starts (`synchronize: true`).

### 4. Start the server

```bash
cd backend
npm run dev
```

Server runs at `http://localhost:3000`. You can verify it with:

```bash
curl http://localhost:3000/api/health
# → { "success": true, "data": { "status": "ok" } }
```

---

## Seed Data (optional)

Populates the database with 10 validators, 100 requesters, and ~200 vacation requests so you have realistic data to work with:

```bash
cd backend
npm run seed
```

> Re-running seed **wipes all existing data** and starts fresh.

Pre-created validator names you can log in with: `Morgan`, `Jordan`, `Taylor`, `Casey`, `Riley`, `Quinn`, `Avery`, `Blake`, `Cameron`, `Drew`.

Pre-created requester names: `Alex 1` through `Alex 100`.

---

## Running Tests

Tests run against a separate `timeoff_test` database so your real data is never touched.

### 1. Create the test database (one-time)

```bash
psql -U postgres -c "CREATE DATABASE timeoff_test;"
```

### 2. Run the tests

```bash
cd backend
npm test
```

**What is tested:**
- `authService` — register (success, duplicate name), login (found, not found)
- `vacationService` — submit, approve, reject, self-approval block, overlap check, 404/409 guards
- `vacationValidators` — date format, date order, missing fields, empty comment

---

## Frontend Setup

> Frontend setup instructions will be added here once the frontend is complete.

---

*Technical decisions and architecture notes will be added when the project is complete.*
