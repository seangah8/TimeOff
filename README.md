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
| Auth     | JWT via httpOnly cookies                |
| Tests    | Vitest                                  |

---

## Running Tests

The backend has integration tests that run against a real PostgreSQL database.

**One-time setup** — create the test database:
```bash
PGPASSWORD="your_password" psql -U postgres -c "CREATE DATABASE timeoff_test;"
```

**Run the tests:**
```bash
cd backend
npm test
```

Tests automatically use `timeoff_test` instead of the main `timeoff` database. Tables are wiped between each test so they never interfere with each other.

**What is tested:**
- `authService` — register (success, duplicate name), login (found, not found)
- `vacationService` — submit, approve, reject, self-approval block, overlap check, 404/409 guards
- `vacationValidators` — date format, date order, missing fields, empty comment

---

*Full setup instructions and technical decisions will be added when the project is complete.*
