# Acceptance Tests – WBOCRM

This document maps READ acceptance criteria to implemented test coverage.  
All tests are located in `backend/tests/` and results saved in `backend/test_results/`.

---

## Test Suite Summary

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| Unit | `tests/unit/authService.test.js` | 6 | ✅ PASS |
| Unit | `tests/unit/scoringService.test.js` | 6 | ✅ PASS |
| Unit | `tests/unit/ticketService.test.js` | 6 | ✅ PASS |
| Unit | `tests/unit/leadService.test.js` | 12 | ✅ PASS |
| Unit | `tests/unit/dashboardService.test.js` | 6 | ✅ PASS |
| Functional | `tests/functional/api.test.js` | 15 | ✅ PASS |
| BDD | `tests/features/auth_login.feature` | 4 scenarios | ✅ PASS |
| BDD | `tests/features/lead_registration.feature` | 2 scenarios | ✅ PASS |
| BDD | `tests/features/lead_scoring.feature` | 3 scenarios | ✅ PASS |
| BDD | `tests/features/ticket_creation.feature` | 2 scenarios | ✅ PASS |
| BDD | `tests/features/duplicate_email.feature` | 2 scenarios | ✅ PASS |
| BDD | `tests/features/interaction_logging.feature` | 2 scenarios | ✅ PASS |
| BDD | `tests/features/pipeline_stage.feature` | 2 scenarios | ✅ PASS |
| BDD | `tests/features/dashboard_kpis.feature` | 2 scenarios | ✅ PASS |
| BDD | `tests/features/csv_export.feature` | 1 scenario | ✅ PASS |
| **Total** | | **53 tests / 20 BDD scenarios** | ✅ All pass |

---

## BDD Acceptance Scenarios

### Feature: Lead Registration (`lead_registration.feature`)

**Scenario 1: Successfully register a new lead**
```gherkin
Given I am authenticated as a sales user
When I submit a new lead with email "bdd_lead@test.wbocrm" and name "BDD Lead"
Then the response status should be 201
And the response should contain a lead_id
```
Covers: US-03, FR-LM-01

**Scenario 2: Reject duplicate email registration**
```gherkin
Given a lead with email "bdd_dup@test.wbocrm" already exists
When I submit a new lead with email "bdd_dup@test.wbocrm" and name "Dup Lead"
Then the response status should be 400
And the response error should be "DUPLICATE_EMAIL"
```
Covers: US-03, FR-LM-02

---

### Feature: Support Ticket Creation (`ticket_creation.feature`)

**Scenario 1: Successfully create a support ticket**
```gherkin
Given I am authenticated as a support user
And a lead exists in the system
When I create a ticket with description "BDD test ticket" and priority "Low"
Then the response status should be 201
And the response should contain a ticket_id
```
Covers: US-11, FR-ST-01

**Scenario 2: Update a ticket status**
```gherkin
Given an existing support ticket
When I update the ticket status to "In Progress"
Then the response status should be 200
And the ticket status should be "In Progress"
```
Covers: US-12, FR-ST-02

---

### Feature: User Authentication (`auth_login.feature`)

**Scenario 1: Successful login with valid credentials**
```gherkin
When I log in with email "bdd_auth_sales@test.wbocrm" and password "BddAuth123!"
Then the response status should be 200
And the response should contain a token
And the token payload should include role "sales"
```
Covers: US-01, FR-AUTH-01

**Scenario 2: Failed login with invalid password**
```gherkin
When I log in with email "bdd_auth_sales@test.wbocrm" and password "WrongPass999!"
Then the response status should be 401
```
Covers: US-01, FR-AUTH-02

**Scenario 3: Rejected request without token**
```gherkin
When I request the leads list without a token
Then the response status should be 401
```
Covers: US-01, FR-AUTH-03

**Scenario 4: Rejected request with insufficient role**
```gherkin
Given I am authenticated as a support user
When I request the leads list
Then the response status should be 403
```
Covers: US-02, FR-AUTH-04

---

### Feature: Lead Priority Scoring (`lead_scoring.feature`)

**Scenario 1: High engagement metrics receive high score**
```gherkin
When I create a lead with metrics calls 20 meetings 5 budget "high" companySize "enterprise" emailOpens 20
Then the response status should be 201
And the lead priority_score should be greater than 70
```
Covers: US-04, FR-SC-01

**Scenario 2: No engagement receives low score**
```gherkin
When I create a lead with metrics calls 0 meetings 0 budget "low" companySize "small" emailOpens 0
Then the response status should be 201
And the lead priority_score should be less than 30
```
Covers: US-04, FR-SC-01

**Scenario 3: Leads list sorted by priority score descending**
```gherkin
When I retrieve all leads
Then the response status should be 200
And leads should be ordered by priority_score descending
```
Covers: US-04, FR-LM-03, FR-SC-01

---

## Functional Test Coverage (`api.test.js`)

| Test | Expected | Covers |
|------|----------|--------|
| POST /api/leads – valid lead | 201 + lead_id | US-03 |
| POST /api/leads – duplicate email | 400 DUPLICATE_EMAIL | US-03 |
| GET /api/leads – sorted DESC | 200 + ordered array | US-04 |
| POST /api/leads/:id/logs – add note | 201 + note_text | US-09, FR-ST-04 |
| GET /api/leads/:id/logs – get logs | 200 + array | US-09, FR-ST-04 |
| PUT /api/leads/:id – pipeline stage | 200 + stage updated | US-05, FR-UC-05 |
| GET /api/tickets – ticket list | 200 + array | FR-ST-09 |
| POST + PUT /api/tickets/:id | 201 then 200 + status updated | US-11, US-12 |
| GET /api/dashboard – KPIs | 200 + all 4 fields | US-13, FR-ST-11/12/14 |
| POST /api/leads – campaign_id | 201 + campaign_id stored | FR-SC-13 |
| GET /api/leads/export/csv | 200 + text/csv header | US-07, FR-DOC-15 |
| GET /api/leads/:id – PII masked (support) | 200 + masked email/name | NFR-ST-07 |
| GET /api/leads/:id – unmasked (sales) | 200 + full data | NFR-ST-07 |
| GET /api/leads – no token | 401 | US-01 |
| GET /api/leads – wrong role | 403 | US-02 |

---

## Unit Test Coverage

### authService (6 tests)
- `hashPassword` returns a bcrypt hash
- `comparePasswords` returns true for matching password
- `comparePasswords` returns false for wrong password
- `generateToken` returns a signed JWT
- `generateToken` payload contains user_id and rbac_role
- `verifyToken` returns the original payload

### scoringService (6 tests)
- Returns 0 for empty metrics
- Caps call score at 25 pts
- Caps meeting score at 25 pts
- Applies correct company size scores (small/medium/enterprise)
- Returns maximum 100 for fully maxed metrics
- Rounds to integer

### ticketService (6 tests)
- Creates a ticket successfully
- Returns TICKET_NOT_FOUND for missing ticket
- Returns CONFLICT when updated_at does not match
- Updates status successfully on valid updated_at
- Validates status enum values
- Assigns ticket to user correctly

### leadService (12 tests)
- Accepts valid pipeline stage "Contacted" (FR-UC-05)
- Throws INVALID_STAGE for unknown stage (FR-UC-05)
- Accepts all four valid stages: New, Contacted, Qualified, Closed (FR-UC-05)
- Updates user_id for lead assignment (FR-SC-06)
- Throws LEAD_NOT_FOUND when lead does not exist (FR-SC-06)
- Creates an interaction note via addLog (FR-ST-04)
- Throws LEAD_NOT_FOUND for addLog on missing lead (FR-ST-04)
- Returns interaction logs via getLogs (FR-ST-04)
- Stores campaign_id when creating a lead (FR-SC-13)
- Anonymises lead PII via erasePersonalData (NFR-ST-07)
- Throws LEAD_NOT_FOUND for erasePersonalData on missing lead (NFR-ST-07)
- Validates engagement metrics (INVALID_METRICS)

### dashboardController (6 tests)
- Returns activeLeads count (FR-ST-11)
- Returns openTickets count (FR-UC-12)
- Returns monthlyRevenue sum (FR-ST-14)
- Returns all four KPI fields (FR-ST-11/12/14)
- Masks top5 PII for support role (NFR-ST-07)
- Does NOT mask top5 PII for admin role (NFR-ST-07)

---

## Non-Functional Requirements Verified

| NFR ID | Requirement | Verification |
|--------|-------------|--------------|
| NFR-ST-05 | Optimistic locking on ticket updates | Unit test: CONFLICT on stale updated_at |
| NFR-ST-12 | Dashboard auto-refresh every 2s | DashboardPage setInterval(2000) implementation |
| NFR-SEC-01 | Passwords hashed with bcrypt | Unit test: hashPassword returns non-plaintext |
| NFR-SEC-02 | JWT auth on all protected routes | Functional test: 401 without token |
| NFR-SEC-03 | Role enforcement | Functional test: 403 for insufficient role |
| NFR-ST-07 | GDPR/KVKK PII masking | leadController masks email/name for support role |
| NFR-ST-07 | Right-to-erasure | DELETE /leads/:id/personal-data, /users/:id/personal-data |
| NFR-ST-15 | Ticket archiving (365+ days) | archiveService daily cron + manual POST /tickets/archive |
| NFR-SEC-04 | Idle session timeout | AuthContext 30-min inactivity auto-logout |
| NFR-ST-14 | Offline draft caching | TicketPage localStorage pending ticket with retry |

---

## Feature: Interaction Logging (`interaction_logging.feature`)

**Scenario 1: Successfully add an interaction note to a lead**
```gherkin
Given I am authenticated as a sales user
And a lead exists in the system
When I add an interaction note "Initial phone call - very interested" to the lead
Then the response status should be 201
And the response should contain the note text "Initial phone call - very interested"
```
Covers: US-09, FR-ST-04

**Scenario 2: Retrieve interaction logs for a lead**
```gherkin
Given I am authenticated as a sales user
And a lead exists in the system
And I add an interaction note "Follow-up email sent" to the lead
When I retrieve the interaction logs for the lead
Then the response status should be 200
And the logs should contain at least 1 entry
```
Covers: US-09, FR-ST-04

---

### Feature: Pipeline Stage Management (`pipeline_stage.feature`)

**Scenario 1: Successfully update pipeline stage to Qualified**
```gherkin
Given I am authenticated as a sales user
And a lead exists in the system
When I update the lead pipeline stage to "Qualified"
Then the response status should be 200
And the lead pipeline_stage should be "Qualified"
```
Covers: US-05, FR-UC-05

**Scenario 2: Reject invalid pipeline stage**
```gherkin
Given I am authenticated as a sales user
And a lead exists in the system
When I update the lead pipeline stage to "InvalidStage"
Then the response status should be 400
And the response error should be "INVALID_STAGE"
```
Covers: US-05, FR-UC-05

---

### Feature: Dashboard KPIs (`dashboard_kpis.feature`)

**Scenario 1: Dashboard returns all KPI fields**
```gherkin
Given I am authenticated as a sales user
When I request the dashboard
Then the response status should be 200
And the dashboard should contain "activeLeads"
And the dashboard should contain "openTickets"
And the dashboard should contain "top5"
And the dashboard should contain "monthlyRevenue"
```
Covers: US-13, FR-ST-11, FR-UC-12, FR-ST-14

**Scenario 2: Dashboard top5 contains leads sorted by score**
```gherkin
Given I am authenticated as a sales user
When I request the dashboard
Then the response status should be 200
And the dashboard top5 should be an array
```
Covers: US-13, FR-ST-11

---

### Feature: CSV Export (`csv_export.feature`)

**Scenario: Successfully export leads as CSV**
```gherkin
Given I am authenticated as a sales user
When I request the leads CSV export
Then the response status should be 200
And the response content-type should be "text/csv"
And the CSV should contain the header "lead_id,contact_name,email"
```
Covers: US-07, FR-DOC-15

---

## Feature: Duplicate Email Detection (`duplicate_email.feature`)

**Scenario 1: Reject lead with existing email**
```gherkin
Given I am authenticated as a sales user
And a lead with email "existing@test.wbocrm" already exists
When I submit a new lead with email "existing@test.wbocrm"
Then the response status should be 400
And the response error should be "DUPLICATE_EMAIL"
```
Covers: US-03, FR-LM-02

**Scenario 2: Frontend redirects to existing lead profile**
```gherkin
Given I am on the leads page
When I create a lead with a duplicate email
Then I should see an error message containing "DUPLICATE_EMAIL"
And a link to the existing lead profile should be displayed
```
Covers: US-03, FR-LM-02

---

## Additional Coverage Notes

The following features are verified via code review and manual testing (frontend-only or complex setup):

| Feature | Implementation | Verification Method |
|---------|---------------|---------------------|
| Ticket archiving | `archiveService.js` | Code review + manual API test |
| Idle session timeout | `AuthContext.jsx` (30 min) | Code review + manual UI test |
| Offline draft caching | `TicketPage.jsx` localStorage | Code review + manual UI test |
| Last admin guard | `userController.updateRole` | Code review + manual API test |
