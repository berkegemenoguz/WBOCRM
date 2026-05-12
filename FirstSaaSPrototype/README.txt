WBOCRM - Web-Based Operational CRM
First SaaS Prototype Submission Package
Istanbul Arel University - HW5 Part 2
May 2026

========================================
FOLDER STRUCTURE
========================================

FirstSaaSPrototype/
├── README.txt                  -- This file
├── deployment_info.txt         -- Deployment guide for Render
├── traceability_matrix.pdf     -- Full requirement traceability (8 sections)
├── user_stories.pdf            -- 20 user stories across 7 epics
├── architecture_description.pdf -- Architecture, UML diagrams, design decisions
├── implementation_summary.pdf  -- Phase-by-phase implementation details
├── acceptance_tests.pdf        -- Test coverage mapped to requirements
│
├── screenshots/                -- 8 UI screenshots
│   ├── login_page.png
│   ├── dashboard.png
│   ├── leads_list.png
│   ├── lead_create.png
│   ├── lead_profile.png
│   ├── tickets_page.png
│   ├── ticket_create.png
│   └── users_page.png
│
├── source_code/
│   ├── backend_package.json
│   ├── frontend_package.json
│   ├── backend_src/            -- Node.js/Express backend
│   │   ├── app.js
│   │   ├── controllers/        -- 6 controllers (auth, lead, ticket, dashboard, user, log)
│   │   ├── services/           -- 5 services (auth, lead, ticket, scoring, archive)
│   │   ├── repositories/       -- 4 repositories (lead, log, ticket, user)
│   │   ├── middleware/         -- authMiddleware, rbacMiddleware
│   │   ├── routes/            -- Express route definitions
│   │   └── db/                -- schema.sql, pool.js, init.js, seed.js
│   └── frontend_src/           -- React/Vite frontend
│       ├── App.jsx, main.jsx, index.css
│       ├── components/         -- NavBar, LeadForm, TicketForm, PriorityTable
│       ├── context/            -- AuthContext (JWT + idle timeout)
│       ├── pages/              -- Login, Dashboard, Leads, LeadProfile, Tickets, Users
│       └── services/           -- api.js (Axios instance)
│
├── test_code/
│   ├── unit/                   -- 5 Jest test suites (38 tests)
│   │   ├── authService.test.js
│   │   ├── scoringService.test.js
│   │   ├── ticketService.test.js
│   │   ├── leadService.test.js
│   │   └── dashboardService.test.js
│   ├── functional/             -- 1 Supertest suite (15 tests)
│   │   └── api.test.js
│   └── features/               -- 9 Cucumber BDD feature files (20 scenarios)
│       ├── auth_login.feature
│       ├── lead_registration.feature
│       ├── lead_scoring.feature
│       ├── ticket_creation.feature
│       ├── duplicate_email.feature
│       ├── interaction_logging.feature
│       ├── pipeline_stage.feature
│       ├── dashboard_kpis.feature
│       ├── csv_export.feature
│       └── step_definitions/steps.js
│
└── test_results/               -- Test execution output
    ├── unit_results.txt / .pdf
    ├── functional_results.txt / .pdf
    ├── bdd_results.txt / .pdf
    └── cucumber_report.json

========================================
FEATURES (14 PHASES)
========================================

1.  Project Setup - Monorepo (backend + frontend)
2.  Database Layer - PostgreSQL with 5 tables
3.  Backend API - Full REST CRUD for leads, tickets, users, dashboard
4.  Middleware & Security - JWT auth + RBAC (admin/sales/support)
5.  Lead Scoring - 5-metric weighted algorithm (0-100)
6.  Frontend - React SPA with 6 pages and 4 reusable components
7.  Testing - 38 unit + 15 functional + 20 BDD = 73 tests
8.  Deployment - Render blueprint (render.yaml)
9.  Documentation - 4 markdown docs + 4 PDFs
10. GDPR/KVKK - PII masking + right-to-erasure endpoints
11. Ticket Archiving - Daily cron for 365+ day old tickets
12. Session Security - 30-min idle timeout + offline ticket drafts
13. Demo Data Seeding - POST /api/setup endpoint
14. Traceability - Full requirement-to-code-to-test matrix

========================================
DEMO CREDENTIALS
========================================

After seeding (POST /api/setup or npm run seed):

  admin@wbocrm.com    / Admin123!    (admin role)
  sales@wbocrm.com    / Sales123!    (sales role)
  support@wbocrm.com  / Support123!  (support role)

========================================
TEST RESULTS SUMMARY
========================================

  Unit Tests:       38/38 PASS  (5 suites)
  Functional Tests: 15/15 PASS  (1 suite)
  BDD Scenarios:    20/20 PASS  (9 features, 78 steps)
  TOTAL:            73/73 PASS
