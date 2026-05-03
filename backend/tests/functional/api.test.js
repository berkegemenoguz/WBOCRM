require('dotenv').config();

const request = require('supertest');
const app     = require('../../src/app');
const pool    = require('../../src/db/pool');
const bcrypt  = require('bcryptjs');

jest.setTimeout(20000);

const SALES_EMAIL   = 'func_sales@test.wbocrm';
const SUPPORT_EMAIL = 'func_support@test.wbocrm';
const LEAD_EMAIL    = 'func_lead@test.wbocrm';
const PASS          = 'FuncTest123!';

let salesToken, supportToken;
let testLeadId, testTicketId;

beforeAll(async () => {
  const hash = await bcrypt.hash(PASS, 12);

  await pool.query(
    `DELETE FROM UserAccount WHERE user_email IN ($1, $2)`,
    [SALES_EMAIL, SUPPORT_EMAIL]
  );
  await pool.query(
    `INSERT INTO UserAccount (user_email, user_password, rbac_role, full_name)
     VALUES ($1, $2, 'sales', 'Func Sales'), ($3, $2, 'support', 'Func Support')`,
    [SALES_EMAIL, hash, SUPPORT_EMAIL]
  );

  const sRes  = await request(app).post('/api/auth/login').send({ user_email: SALES_EMAIL,   user_password: PASS });
  const spRes = await request(app).post('/api/auth/login').send({ user_email: SUPPORT_EMAIL, user_password: PASS });

  salesToken   = sRes.body.token;
  supportToken = spRes.body.token;
});

afterAll(async () => {
  if (testTicketId) await pool.query('DELETE FROM SupportTicket WHERE ticket_id = $1', [testTicketId]);
  if (testLeadId) {
    await pool.query('DELETE FROM InteractionLog WHERE lead_id = $1', [testLeadId]);
    await pool.query('DELETE FROM SupportTicket WHERE lead_id = $1', [testLeadId]);
    await pool.query('DELETE FROM Lead WHERE lead_id = $1', [testLeadId]);
  }
  await pool.query('DELETE FROM Lead WHERE email = $1', [LEAD_EMAIL]);
  await pool.query('DELETE FROM UserAccount WHERE user_email IN ($1, $2)', [SALES_EMAIL, SUPPORT_EMAIL]);
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

  test('returns 400 DUPLICATE_EMAIL for already-existing email', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ email: LEAD_EMAIL, contact_name: 'Dup Lead', metrics: {} });

    expect(res.status).toBe(400);
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

// ── Auth middleware ──────────────────────────────────────────────
describe('Auth middleware', () => {
  test('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  test('returns 403 when role is insufficient', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${supportToken}`);
    expect(res.status).toBe(403);
  });
});
