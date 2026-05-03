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
| `GET` | `/api/users` | ✅ | admin | List all users |
| `PUT` | `/api/users/:id/role` | ✅ | admin | Assign a new RBAC role to a user |

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Successful GET / PUT / DELETE |
| `201` | Resource created successfully |
| `400` | Validation failure or business rule violation |
| `401` | Missing or invalid JWT token |
| `403` | Valid token, insufficient role |
| `404` | Entity not found |
| `409` | Concurrent edit conflict (`updated_at` mismatch) |
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
