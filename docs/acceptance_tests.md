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
| Functional | `tests/functional/api.test.js` | 6 | ✅ PASS |
| BDD | `tests/features/auth_login.feature` | 4 scenarios | ✅ PASS |
| BDD | `tests/features/lead_registration.feature` | 2 scenarios | ✅ PASS |
| BDD | `tests/features/lead_scoring.feature` | 3 scenarios | ✅ PASS |
| BDD | `tests/features/ticket_creation.feature` | 2 scenarios | ✅ PASS |
| **Total** | | **35 tests / 11 BDD scenarios** | ✅ All pass |

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
| POST + PUT /api/tickets/:id | 201 then 200 + status updated | US-11, US-12 |
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

---

## Non-Functional Requirements Verified

| NFR ID | Requirement | Verification |
|--------|-------------|--------------|
| NFR-ST-05 | Optimistic locking on ticket updates | Unit test: CONFLICT on stale updated_at |
| NFR-ST-12 | Dashboard auto-refresh every 2s | DashboardPage setInterval(2000) implementation |
| NFR-SEC-01 | Passwords hashed with bcrypt | Unit test: hashPassword returns non-plaintext |
| NFR-SEC-02 | JWT auth on all protected routes | Functional test: 401 without token |
| NFR-SEC-03 | Role enforcement | Functional test: 403 for insufficient role |
