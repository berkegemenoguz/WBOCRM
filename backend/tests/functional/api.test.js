require('dotenv').config();

const request = require('supertest');
const app     = require('../../src/app');
const pool    = require('../../src/db/pool');
const bcrypt  = require('bcryptjs');

jest.setTimeout(20000);

const SALES_EMAIL   = 'func_sales@test.wbocrm';
const SUPPORT_EMAIL = 'func_support@test.wbocrm';
const ADMIN_EMAIL   = 'func_admin@test.wbocrm';
const LEAD_EMAIL    = 'func_lead@test.wbocrm';
const PASS          = 'FuncTest123!';

let salesToken, supportToken, adminToken;
let testLeadId, testTicketId;

beforeAll(async () => {
  const hash = await bcrypt.hash(PASS, 12);

  await pool.query(
    `DELETE FROM UserAccount WHERE user_email IN ($1, $2, $3)`,
    [SALES_EMAIL, SUPPORT_EMAIL, ADMIN_EMAIL]
  );
  await pool.query(
    `INSERT INTO UserAccount (user_email, user_password, rbac_role, full_name)
     VALUES ($1, $2, 'sales', 'Func Sales'), ($3, $2, 'support', 'Func Support'), ($4, $2, 'admin', 'Func Admin')`,
    [SALES_EMAIL, hash, SUPPORT_EMAIL, ADMIN_EMAIL]
  );

  const sRes  = await request(app).post('/api/auth/login').send({ user_email: SALES_EMAIL,   user_password: PASS });
  const spRes = await request(app).post('/api/auth/login').send({ user_email: SUPPORT_EMAIL, user_password: PASS });
  const aRes  = await request(app).post('/api/auth/login').send({ user_email: ADMIN_EMAIL,   user_password: PASS });

  salesToken   = sRes.body.token;
  supportToken = spRes.body.token;
  adminToken   = aRes.body.token;
});

afterAll(async () => {
  if (testTicketId) await pool.query('DELETE FROM SupportTicket WHERE ticket_id = $1', [testTicketId]);
  if (testLeadId) {
    await pool.query('DELETE FROM InteractionLog WHERE lead_id = $1', [testLeadId]);
    await pool.query('DELETE FROM SupportTicket WHERE lead_id = $1', [testLeadId]);
    await pool.query('DELETE FROM Lead WHERE lead_id = $1', [testLeadId]);
  }
  await pool.query(`DELETE FROM Lead WHERE email LIKE 'func_%@test.wbocrm'`);
  await pool.query('DELETE FROM Lead WHERE email = $1', [LEAD_EMAIL]);
  await pool.query('DELETE FROM UserAccount WHERE user_email IN ($1, $2, $3)', [SALES_EMAIL, SUPPORT_EMAIL, ADMIN_EMAIL]);
  await pool.end();
});

// ── POST /api/leads ──────────────────────────────────────────────
describe('POST /api/leads', () => {
  test('returns 201 Created for a valid new lead', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ email: LEAD_EMAIL, contact_name: 'Func Lead', metrics: { calls: 5 } });

    expect(res.status).toBe(201);
    expect(res.body.lead_id).toBeDefined();
    testLeadId = res.body.lead_id;
  });

  test('returns 409 DUPLICATE_EMAIL for already-existing email', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ email: LEAD_EMAIL, contact_name: 'Dup Lead', metrics: {} });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('DUPLICATE_EMAIL');
  });
});

// ── GET /api/leads ───────────────────────────────────────────────
describe('GET /api/leads', () => {
  test('returns 200 with leads sorted by priority_score DESC', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const scores = res.body.map(l => Number(l.priority_score));
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
    }
  });
});

// ── PUT /api/tickets/:id ─────────────────────────────────────────
describe('PUT /api/tickets/:id', () => {
  test('returns 200 OK for a valid ticket update', async () => {
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${supportToken}`)
      .send({ description: 'Functional test ticket', priority_level: 'Low', lead_id: testLeadId });

    expect(createRes.status).toBe(201);
    testTicketId = createRes.body.ticket_id;

    const res = await request(app)
      .put(`/api/tickets/${testTicketId}`)
      .set('Authorization', `Bearer ${supportToken}`)
      .send({ status: 'In Progress', updated_at: createRes.body.updated_at });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('In Progress');
  });
});

// ── FR-ST-04 — Interaction Logging ──────────────────────────────
describe('POST /api/leads/:id/logs', () => {
  test('returns 201 and creates an interaction log for a lead', async () => {
    const res = await request(app)
      .post(`/api/leads/${testLeadId}/logs`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ note_text: 'Initial call with the client' });

    expect(res.status).toBe(201);
    expect(res.body.note_text).toBe('Initial call with the client');
    expect(res.body.lead_id).toBe(testLeadId);
  });

  test('returns logs for the lead via GET', async () => {
    const res = await request(app)
      .get(`/api/leads/${testLeadId}/logs`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

// ── FR-UC-05 — Pipeline Stage Management ────────────────────────
describe('PUT /api/leads/:id – pipeline stage', () => {
  test('returns 200 and updates pipeline_stage to Contacted', async () => {
    const res = await request(app)
      .put(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ pipeline_stage: 'Contacted' });

    expect(res.status).toBe(200);
    expect(res.body.pipeline_stage).toBe('Contacted');
  });
});

// ── FR-ST-09 — Centralized Ticket List ──────────────────────────
describe('GET /api/tickets', () => {
  test('returns 200 with ticket array for support user', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${supportToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── FR-ST-11/12/14 — Dashboard KPIs ────────────────────────────
describe('GET /api/dashboard', () => {
  test('returns 200 with all KPI fields', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('activeLeads');
    expect(res.body).toHaveProperty('openTickets');
    expect(res.body).toHaveProperty('top5');
    expect(res.body).toHaveProperty('monthlyRevenue');
    expect(Array.isArray(res.body.top5)).toBe(true);
  });
});

// ── FR-SC-13 — Campaign Tracking ────────────────────────────────
describe('POST /api/leads – campaign_id', () => {
  test('stores campaign_id with new lead', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ email: 'func_camp@test.wbocrm', contact_name: 'Camp Lead', metrics: {}, campaign_id: 'CAMP-2026-Q2' });

    expect(res.status).toBe(201);
    expect(res.body.campaign_id).toBe('CAMP-2026-Q2');
  });
});

// ── FR-DOC-15 — CSV Export ──────────────────────────────────────
describe('GET /api/leads/export/csv', () => {
  test('returns 200 with CSV content-type', async () => {
    const res = await request(app)
      .get('/api/leads/export/csv')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('lead_id,contact_name,email');
  });
});

// ── NFR-ST-07 — PII Masking for support role ────────────────────
describe('GET /api/leads – PII masking', () => {
  test('support role receives masked email and name', async () => {
    const res = await request(app)
      .get(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${supportToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toMatch(/^.\*\*\*@/);
    expect(res.body.contact_name).not.toBe('Func Lead');
  });

  test('sales role receives unmasked data', async () => {
    const res = await request(app)
      .get(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(LEAD_EMAIL);
    expect(res.body.contact_name).toBe('Func Lead');
  });
});

// ── Auth middleware ──────────────────────────────────────────────
describe('Auth middleware', () => {
  test('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  test('returns 403 when role is insufficient', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${supportToken}`)
      .send({ email: 'rbac_test@test.wbocrm', contact_name: 'RBAC Test', metrics: {} });
    expect(res.status).toBe(403);
  });
});
