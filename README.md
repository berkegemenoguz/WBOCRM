# WBO CRM

A web-based operational CRM prototype built for Istanbul Arel University — HW5 Part 2. The system covers the full vertical slice: React SPA → Node.js REST API → PostgreSQL, deployed on Vercel (frontend) and Render (backend + database).

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Lead Scoring Algorithm](#lead-scoring-algorithm)
7. [Authentication & RBAC](#authentication--rbac)
8. [Concurrent Conflict Detection](#concurrent-conflict-detection)
9. [Project Structure](#project-structure)
10. [Local Setup](#local-setup)
11. [Running Tests](#running-tests)
12. [Deployment](#deployment)
13. [Feature Coverage](#feature-coverage)

---

## Overview

WBO CRM is an operational CRM designed for three distinct user roles: **Sales Representatives**, **Customer Support Staff**, and **System Administrators**. Each role has a dedicated scope of responsibility enforced via JWT-based Role-Based Access Control (RBAC).

| Feature | Description |
|---|---|
| Lead Management | Register leads, auto-calculate priority score, manage pipeline stages |
| Support Tickets | Create and manage tickets linked to leads with concurrent edit protection |
| Operational Dashboard | Real-time active lead count, open ticket count, top-5 priority leads |
| User Management | Admin-only interface for assigning and changing user roles |
| Interaction Logs | Per-lead note history visible to all authenticated users |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend runtime | Node.js + Express.js | Express ^4.18 |
| Frontend | React + Vite | React ^18, Vite ^5 |
| Database | PostgreSQL | Hosted on Render |
| Auth | jsonwebtoken + bcryptjs | JWT ^9, bcryptjs ^2.4 |
| HTTP client | axios | ^1.6 |
| Routing | react-router-dom | ^6 |
| Unit tests | Jest + Supertest | Jest ^29, Supertest ^6 |
| Acceptance tests | Cucumber.js | @cucumber/cucumber ^10 |
| Frontend deploy | Vercel | — |
| Backend deploy | Render | — |

---

## Architecture

The backend follows a strict 3-tier, MVC-layered architecture. Each layer has exactly one responsibility and is forbidden from crossing into another layer's domain.

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                                │
│   React SPA (Vercel)                                               │
│   /login  |  /dashboard  |  /leads  |  /tickets  |  /users        │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ HTTPS / JSON
┌─────────────────────────────▼──────────────────────────────────────┐
│                   APPLICATION TIER (Render)                        │
│                                                                    │
│  Controller Layer  →  Service Layer  →  Repository Layer          │
│                                                                    │
│  authController       authService        userRepository           │
│  leadController       leadService        leadRepository           │
│  ticketController     scoringService     ticketRepository         │
│  logController        ticketService      logRepository            │
│  dashboardController                                               │
│  userController                                                    │
│                                                                    │
│  RBAC Middleware (JWT verification + role check)                   │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ SSL / pg.Pool
┌─────────────────────────────▼──────────────────────────────────────┐
│                  DATA TIER (Render PostgreSQL)                     │
│   UserAccount  |  Lead  |  SupportTicket  |  InteractionLog       │
└────────────────────────────────────────────────────────────────────┘
```

### Layer rules

| Layer | Responsibility | Forbidden |
|---|---|---|
| `controllers/` | Parse request, call service, send HTTP response | Business logic, direct DB access |
| `services/` | Business logic, orchestrate repositories | Touching `req`/`res` |
| `repositories/` | Parameterized SQL queries, return plain rows | Business logic, validation |
| `middleware/` | Token verification, role checking | Business logic, DB access |

---

## Database Schema

```sql
CREATE TABLE UserAccount (
  user_id       SERIAL PRIMARY KEY,
  user_email    VARCHAR(48)  UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL,            -- bcrypt hash, saltRounds=12
  rbac_role     VARCHAR(20)  NOT NULL
                CHECK (rbac_role IN ('sales', 'support', 'admin')),
  full_name     VARCHAR(100) NOT NULL
);

CREATE TABLE Lead (
  lead_id        SERIAL PRIMARY KEY,
  email          VARCHAR(100) UNIQUE NOT NULL,
  contact_name   VARCHAR(100) NOT NULL,
  priority_score DECIMAL(5,2) DEFAULT 0.0,
  pipeline_stage VARCHAR(50)  DEFAULT 'New'
                 CHECK (pipeline_stage IN ('New', 'Contacted', 'Qualified', 'Closed')),
  user_id        INTEGER REFERENCES UserAccount(user_id),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE SupportTicket (
  ticket_id      SERIAL PRIMARY KEY,
  description    TEXT NOT NULL,
  priority_level VARCHAR(10) NOT NULL
                 CHECK (priority_level IN ('Low', 'Medium', 'High')),
  status         VARCHAR(20) DEFAULT 'Open'
                 CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  lead_id        INTEGER REFERENCES Lead(lead_id),
  user_id        INTEGER REFERENCES UserAccount(user_id),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()          -- used for conflict detection
);

CREATE TABLE InteractionLog (
  log_id    SERIAL PRIMARY KEY,
  note_text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  lead_id   INTEGER REFERENCES Lead(lead_id),
  user_id   INTEGER REFERENCES UserAccount(user_id)
);
```

### Relationships

```
UserAccount "1" ──── "N" Lead
UserAccount "1" ──── "N" SupportTicket
UserAccount "1" ──── "N" InteractionLog
Lead        "1" ──── "N" SupportTicket
Lead        "1" ──── "N" InteractionLog
```

---

## API Reference

All endpoints are prefixed with `/api`. All responses are JSON.
Protected endpoints require the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `user_email, user_password, rbac_role, full_name` | `201` user object |
| `POST` | `/api/auth/login` | Public | `user_email, user_password` | `200` `{ token, user }` |

### Lead Management

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/leads` | ✅ | sales, admin | List all leads ordered by `priority_score DESC` |
| `POST` | `/api/leads` | ✅ | sales, admin | Create lead + auto-calculate score |
| `GET` | `/api/leads/:id` | ✅ | sales, admin | Get single lead |
| `PUT` | `/api/leads/:id` | ✅ | sales, admin | Update pipeline stage or fields |
| `DELETE` | `/api/leads/:id` | ✅ | sales, admin | Delete lead |
| `GET` | `/api/leads/:id/logs` | ✅ | all | Interaction log history |
| `POST` | `/api/leads/:id/logs` | ✅ | all | Add interaction note |

**POST /api/leads — request body:**
```json
{
  "email": "alice@example.com",
  "contact_name": "Alice Johnson",
  "pipeline_stage": "New",
  "metrics": {
    "calls": 10,
    "meetings": 3,
    "budget": 75,
    "companySize": "medium",
    "emailOpens": 8
  }
}
```

### Support Tickets

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/tickets` | ✅ | support, admin | List all tickets |
| `POST` | `/api/tickets` | ✅ | support, admin | Create ticket linked to a lead |
| `GET` | `/api/tickets/:id` | ✅ | support, admin | Get single ticket |
| `PUT` | `/api/tickets/:id` | ✅ | support, admin | Update status / priority (conflict-safe) |
| `DELETE` | `/api/tickets/:id` | ✅ | support, admin | Delete ticket |

**PUT /api/tickets/:id — request body:**
```json
{
  "status": "In Progress",
  "priority_level": "High",
  "updated_at": "2024-01-01T10:00:00.000Z"
}
```
The `updated_at` field is used for optimistic locking. If it does not match the database value, the server returns `409 Conflict`.

### Dashboard & User Management

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/dashboard` | ✅ | all | Active lead count, open ticket count, top-5 leads by score |
| `GET` | `/api/users` | ✅ | admin | List all users (includes `full_name`) |
| `PUT` | `/api/users/:id/role` | ✅ | admin | Assign a new RBAC role; blocks demotion of the last admin (409) |
| `DELETE` | `/api/leads/:id/personal-data` | ✅ | admin | Erase lead PII — anonymises email/name, purges interaction logs (GDPR) |
| `DELETE` | `/api/users/:id/personal-data` | ✅ | admin | Erase user account PII — anonymises email and full_name (KVKK) |

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Successful GET / PUT / DELETE |
| `201` | Resource created successfully |
| `400` | Validation failure or business rule violation |
| `401` | Missing or invalid JWT token |
| `403` | Valid token, insufficient role |
| `404` | Entity not found |
| `409` | Concurrent edit conflict (`updated_at` mismatch) or business rule violation (e.g. demoting last admin) |
| `500` | Unhandled server error |

### Error Response Shape

Every error response follows this structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

---

## Lead Scoring Algorithm

When a lead is created, `scoringService.calculateScore(metrics)` is called synchronously. It returns a 0–100 integer score based on five engagement metrics:

```js
function calculateScore({ calls, meetings, budget, companySize, emailOpens }) {
  const callScore    = Math.min(calls / 20, 1) * 25;      // max 25 pts at 20 calls
  const meetingScore = Math.min(meetings / 5, 1) * 25;    // max 25 pts at 5 meetings
  const budgetScore  = Math.min(budget / 100, 1) * 20;    // max 20 pts at $100K
  const sizeScore    = { small: 5, medium: 10, enterprise: 20 }[companySize] ?? 5;
  const emailScore   = Math.min(emailOpens / 20, 1) * 10; // max 10 pts at 20 opens

  return Math.round(callScore + meetingScore + budgetScore + sizeScore + emailScore);
}
```

| Metric | Max Points | Saturation Point |
|---|---|---|
| Calls | 25 | 20 calls |
| Meetings | 25 | 5 meetings |
| Budget | 20 | $100K |
| Company Size | 20 | Enterprise |
| Email Opens | 10 | 20 opens |
| **Total** | **100** | — |

The dashboard's top-5 list and the `GET /api/leads` endpoint both order leads by `priority_score DESC`.

---

## Authentication & RBAC

### JWT

- Tokens are signed with `JWT_SECRET` (environment variable, never in source).
- Token expiry: **30 minutes** (`expiresIn: '30m'`).
- Payload: `{ user_id, user_email, rbac_role }`.
- After expiry, the server returns `401 Unauthorized` and the user must log in again.

### Password hashing

Passwords are hashed with `bcryptjs` at `saltRounds=12` before being stored. Plain-text passwords are never persisted.

### Role matrix

| Endpoint group | sales | support | admin |
|---|:---:|:---:|:---:|
| Lead CRUD | ✅ | ❌ | ✅ |
| Ticket CRUD | ❌ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Interaction logs | ✅ | ✅ | ✅ |
| User management | ❌ | ❌ | ✅ |

### Middleware chain

```
Request → authMiddleware (verify token) → allowRoles(...) (check role) → controller
```

`authMiddleware` attaches the decoded payload to `req.user`. `allowRoles` is a factory that returns a middleware closure for the specified roles.

---

## Concurrent Conflict Detection

`PUT /api/tickets/:id` implements optimistic locking to prevent last-write-wins data loss when multiple users edit the same ticket simultaneously.

**How it works:**

1. The client sends the `updated_at` timestamp it received when it last fetched the ticket.
2. The server fetches the current record and compares timestamps.
3. If they differ, another user has edited the record in the meantime — the server rejects the update with `409 Conflict`.
4. If they match, the update proceeds and `updated_at` is refreshed to `NOW()`.

```js
if (updated_at && new Date(current.updated_at).toISOString() !== new Date(updated_at).toISOString()) {
  const err = new Error('Ticket was modified by another user');
  err.code = 'CONFLICT';
  throw err;
}
```

The frontend surfaces this as an explicit error message asking the user to reload before retrying.

---

## Project Structure

```
WBOCRM/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── leadController.js
│   │   │   ├── ticketController.js
│   │   │   ├── logController.js
│   │   │   ├── dashboardController.js
│   │   │   └── userController.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── leadService.js
│   │   │   ├── scoringService.js
│   │   │   └── ticketService.js
│   │   ├── repositories/
│   │   │   ├── userRepository.js
│   │   │   ├── leadRepository.js
│   │   │   ├── ticketRepository.js
│   │   │   └── logRepository.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── rbacMiddleware.js
│   │   ├── routes/
│   │   │   └── index.js
│   │   └── db/
│   │       ├── pool.js
│   │       ├── schema.sql
│   │       ├── init.js
│   │       └── seed.js
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── authService.test.js
│   │   │   ├── scoringService.test.js
│   │   │   └── ticketService.test.js
│   │   ├── functional/
│   │   │   └── api.test.js
│   │   └── features/
│   │       ├── lead_registration.feature
│   │       ├── duplicate_email.feature
│   │       ├── ticket_creation.feature
│   │       ├── auth_login.feature
│   │       └── step_definitions/
│   │           └── steps.js
│   ├── jest.config.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LeadPage.jsx
│   │   │   ├── TicketPage.jsx
│   │   │   └── UsersPage.jsx
│   │   ├── components/
│   │   │   ├── NavBar.jsx
│   │   │   ├── LeadForm.jsx
│   │   │   ├── TicketForm.jsx
│   │   │   └── PriorityTable.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── App.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   └── package.json
├── .gitignore
└── CRM_PROJECT_PLAN.md
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- A PostgreSQL database (local or Render)

### 1. Clone the repository

```bash
git clone https://github.com/berkegemenoguz/WBOCRM.git
cd WBOCRM
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your_secret_key
PORT=3000
FRONTEND_URL=http://localhost:5173
```

Initialize the database schema and seed data:

```bash
npm run db:init
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Seed credentials

| Email | Password | Role |
|---|---|---|
| `admin@crm.com` | `Admin123!` | admin |
| `sales@crm.com` | `Sales123!` | sales |
| `support@crm.com` | `Support123!` | support |

---

## Running Tests

All test commands are run from the `backend/` directory.

### Unit tests (Jest)

Tests are isolated using `jest.mock()` for repositories. The scoring service tests are pure input/output with no mocking.

```bash
npm run test:unit
```

Covers:
- `authService` — password hashing, JWT generation, duplicate email, invalid credentials
- `scoringService` — score calculation for all metric combinations, max cap at 100
- `ticketService` — priority validation, status validation, conflict detection, not-found handling

### Functional tests (Supertest)

Tests hit the actual Express app against a real database. Requires a valid `DATABASE_URL` in `.env`.

```bash
npm run test:functional
```

Covers:
- `POST /api/leads` — 201 on success, 400 on duplicate email
- `GET /api/leads` — 200 with priority-sorted list
- `PUT /api/tickets/:id` — 200 on success
- Unauthenticated request — 401
- Wrong role request — 403

### Acceptance tests (Cucumber BDD)

```bash
npm run test:bdd
```

Feature files are in `tests/features/`. Each `.feature` file maps to a use case from the requirements:

- `lead_registration.feature` — US-01, US-02
- `duplicate_email.feature` — duplicate email rejection
- `ticket_creation.feature` — US-05
- `auth_login.feature` — US-08, session timeout

---

## Deployment

### Backend → Render

1. Create a **Web Service** on [render.com](https://render.com), connect this repository.
2. Set Root Directory to `backend/`.
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`

SSL is handled automatically — the pool detects Render by checking if `DATABASE_URL` contains `render.com` and enables `{ rejectUnauthorized: false }`.

### Frontend → Vercel

1. Create a **New Project** on [vercel.com](https://vercel.com), connect this repository.
2. Set Root Directory to `frontend/`, Framework to **Vite**.
3. Add environment variable: `VITE_API_URL=https://<your-render-service>.onrender.com/api`
4. After deploy, add the Vercel URL to `FRONTEND_URL` in the Render backend environment.

`vercel.json` already contains the SPA rewrite rule so all routes resolve to `index.html`.

---

## Feature Coverage

The tables below map each documented requirement to the exact location in the application where it can be observed or tested.

### Functional Requirements

| ID | Feature | Status | Where to verify |
|---|---|:---:|---|
| FR-ST-01 | Lead record creation | ✅ | `/leads` → click **+ New Lead** → fill form → **Save** |
| FR-UC-02 | Dynamic lead scoring | ✅ | Create or edit a lead with metrics — score appears in the table and in the green banner after save |
| FR-SC-03 | Lead prioritisation display | ✅ | `/leads` — table is ordered by score descending; `/dashboard` shows top-5 |
| FR-ST-04 | Interaction logging | ✅ | Any lead → **Profile** → "Interaction Log" section → add a note |
| FR-UC-05 | Pipeline stage progression | ✅ | Lead profile → "Pipeline Stage" dropdown → change stage → auto-saved |
| FR-SC-06 | Lead assignment | ✅ | Lead profile (admin) → "Assigned To" dropdown → select a sales user |
| FR-ST-07 | Support ticket generation | ✅ | Lead profile (support/admin) → **+ Generate Ticket** inline form, or `/tickets` → **+ New Ticket** |
| FR-UC-08 | Ticket status management | ✅ | `/tickets` → **Edit** on any ticket → change status or priority → **Save** |
| FR-ST-09 | Centralised ticket display | ✅ | `/tickets` — all tickets in a single table regardless of lead |
| FR-SC-10 | Ticket priority tagging | ✅ | Create or edit a ticket — priority field accepts Low / Medium / High only |
| FR-ST-11 | Active lead count | ✅ | `/dashboard` — "Active Leads" KPI card (excludes Closed leads) |
| FR-UC-12 | Open ticket count | ✅ | `/dashboard` — "Open Tickets" KPI card (excludes Resolved/Closed) |
| FR-SC-13 | Campaign linking | ✅ | Create a lead → fill "Campaign ID" field → visible in lead profile |
| FR-ST-14 | Monthly revenue tracking | ✅ | `/dashboard` — "Monthly Revenue" KPI card (sum of `deal_value` for Closed leads this month) |
| FR-DOC-15 | CSV data export | ✅ | `/leads` — `GET /api/leads/export/csv` (sales/admin); triggers file download |

### Non-Functional Requirements

| ID | Quality attribute | Status | Where to verify |
|---|---|:---:|---|
| NFR-ST-01 | Lead entry ≤ 3 clicks | ✅ | NavBar **Leads** (1) → **+ New Lead** (2) → **Save** (3) |
| NFR-ST-02 | Mobile 360 px viewport | ✅ | Resize browser to 360 px — layout reflows, no horizontal scroll, all actions reachable |
| NFR-ST-03 | Ticket search ≤ 5 s | ✅ | `/tickets` — type in the search box; results filter instantly (client-side) |
| NFR-ST-04 | 99.5 % uptime (08:00–20:00) | ⚠️ | Infrastructure — depends on Render SLA |
| NFR-ST-05 | Concurrent edit protection | ✅ | Open the same ticket in two tabs; submit the second edit — server returns `409 Conflict` |
| NFR-ST-06 | Release downtime ≤ 15 min | ⚠️ | Infrastructure — Vercel zero-downtime + Render rolling restart |
| NFR-ST-07 | GDPR / KVKK PII masking | ✅ | Log in as `support@crm.com` → `/leads` — email shows as `a***@domain`, name as `A. J***` |
| NFR-ST-08 | Secure authentication | ✅ | Attempt login with wrong password → `401`; inspect DB — password is a bcrypt hash |
| NFR-ST-09 | Idle session timeout 30 min | ✅ | Leave the app idle for 30 min with no mouse/keyboard activity — session clears automatically |
| NFR-ST-10 | Score calculation ≤ 500 ms | ✅ | `scoringService.calculateScore()` is pure synchronous math; measured < 1 ms |
| NFR-ST-11 | API response ≤ 200 ms | ✅ | Browser DevTools Network tab — all `/api/*` responses < 200 ms on warm Render instance |
| NFR-ST-12 | Dashboard 2 s auto-refresh | ✅ | `/dashboard` — KPI values update every 2 seconds without a page reload |
| NFR-ST-13 | 100 k record capacity | ✅ | `node test_results/capacity_test.js` — inserts 100k rows, measures query time (avg 735 ms), cleans up |
| NFR-ST-14 | 50 req/sec throughput | ✅ | `node test_results/load_test_runner.js` — measured 83.3 req/sec, 0 % error rate |
| NFR-ST-15 | Ticket auto-archive > 365 days | ✅ | `POST /api/tickets/archive` (admin) triggers manual run; scheduler runs daily on startup |

### Use Cases

| ID | Use case | Status | Where to verify |
|---|---|:---:|---|
| UC-1 | Register new lead | ✅ | `/leads` → **+ New Lead** → submit; try a duplicate email — error shows link to existing profile |
| UC-2 | Calculate lead score | ✅ | Create a lead with varying metric values — score shown in green banner and lead table |
| UC-3 | Manage sales pipeline | ✅ | Lead profile (sales/admin) → change stage dropdown; invalid role → `403` |
| UC-4 | View operational dashboard | ✅ | `/dashboard` — KPI cards clickable; Monthly Revenue card hidden for support role (sales-only metric) |
| UC-5 | Manage RBAC & users | ✅ | `/users` (admin) → change a user's role; removing own admin role → error; demoting last admin in system → 409 blocked |
| UC-6 | Generate support ticket | ✅ | Lead profile → **+ Generate Ticket**; if the server is unreachable the draft is saved to `localStorage` |
| UC-7 | Manage ticket status | ✅ | `/tickets` → **Edit** → update status; concurrent edit from another tab triggers conflict warning |

### Data & Compliance

| ID | Requirement | Status | Where to verify |
|---|---|:---:|---|
| CON-REG-01 | KVKK right-to-erasure (users) | ✅ | `/users` (admin) → **Erase Data** button per row → confirmation dialog → `DELETE /api/users/:id/personal-data` |
| CON-REG-02 | GDPR right to be forgotten (leads) | ✅ | Lead profile (admin) → **Erase Personal Data** button (top-right) → confirmation dialog → `DELETE /api/leads/:id/personal-data` |
| CON-REG-03 | Synthetic dataset | ✅ | `npm run db:seed` — all seed records are fictitious |
| CON-ENV-02 | BDD / TDD test coverage | ✅ | `npm run test:unit` · `npm run test:functional` · `npm run test:bdd` |
