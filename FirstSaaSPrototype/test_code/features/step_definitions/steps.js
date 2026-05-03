require('dotenv').config();

const { Given, When, Then, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const request = require('supertest');
const app     = require('../../../src/app');
const pool    = require('../../../src/db/pool');
const bcrypt  = require('bcryptjs');
const assert  = require('assert');
const jwt     = require('jsonwebtoken');

setDefaultTimeout(20000);

const BDD_SALES_EMAIL   = 'bdd_auth_sales@test.wbocrm';
const BDD_SUPPORT_EMAIL = 'bdd_support@test.wbocrm';
const BDD_PASS          = 'BddAuth123!';

let salesToken, supportToken;
let sharedLeadId, sharedTicketId;
let lastResponse;

// ── Setup/teardown ────────────────────────────────────────────────
Before(async () => {
  const hash = await bcrypt.hash(BDD_PASS, 12);
  await pool.query(
    `DELETE FROM UserAccount WHERE user_email IN ($1, $2)`,
    [BDD_SALES_EMAIL, BDD_SUPPORT_EMAIL]
  );
  await pool.query(
    `INSERT INTO UserAccount (user_email, user_password, rbac_role, full_name)
     VALUES ($1, $2, 'sales', 'BDD Sales'), ($3, $2, 'support', 'BDD Support')`,
    [BDD_SALES_EMAIL, hash, BDD_SUPPORT_EMAIL]
  );
  const sRes  = await request(app).post('/api/auth/login').send({ user_email: BDD_SALES_EMAIL,   user_password: BDD_PASS });
  const spRes = await request(app).post('/api/auth/login').send({ user_email: BDD_SUPPORT_EMAIL, user_password: BDD_PASS });
  salesToken   = sRes.body.token;
  supportToken = spRes.body.token;
});

After(async () => {
  const cleanEmails = [
    'bdd_lead@test.wbocrm',
    'bdd_dup@test.wbocrm',
    'bdd_score_high@test.wbocrm',
    'bdd_score_low@test.wbocrm',
  ];
  if (sharedTicketId) {
    await pool.query('DELETE FROM SupportTicket WHERE ticket_id = $1', [sharedTicketId]);
    sharedTicketId = null;
  }
  if (sharedLeadId) {
    await pool.query('DELETE FROM InteractionLog WHERE lead_id = $1', [sharedLeadId]);
    await pool.query('DELETE FROM SupportTicket WHERE lead_id = $1', [sharedLeadId]);
    await pool.query('DELETE FROM Lead WHERE lead_id = $1', [sharedLeadId]);
    sharedLeadId = null;
  }
  for (const email of cleanEmails) {
    const r = await pool.query('SELECT lead_id FROM Lead WHERE email = $1', [email]);
    if (r.rows[0]) {
      const lid = r.rows[0].lead_id;
      await pool.query('DELETE FROM InteractionLog WHERE lead_id = $1', [lid]);
      await pool.query('DELETE FROM SupportTicket WHERE lead_id = $1', [lid]);
      await pool.query('DELETE FROM Lead WHERE lead_id = $1', [lid]);
    }
  }
  await pool.query(
    `DELETE FROM UserAccount WHERE user_email IN ($1, $2)`,
    [BDD_SALES_EMAIL, BDD_SUPPORT_EMAIL]
  );
});

// ── Given ─────────────────────────────────────────────────────────
Given('I am authenticated as a sales user', () => {
  // token set in Before
});

Given('I am authenticated as a support user', () => {
  // token set in Before
});

Given('a lead with email {string} already exists', async (email) => {
  const res = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesToken}`)
    .send({ email, contact_name: 'Pre-existing Lead', metrics: {} });
  if (res.status === 201) sharedLeadId = res.body.lead_id;
});

Given('a lead exists in the system', async () => {
  const res = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesToken}`)
    .send({ email: 'bdd_for_ticket@test.wbocrm', contact_name: 'Ticket Lead', metrics: {} });
  assert.strictEqual(res.status, 201);
  sharedLeadId = res.body.lead_id;
});

Given('an existing support ticket', async () => {
  // Ensure lead exists first
  if (!sharedLeadId) {
    const lr = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ email: 'bdd_for_ticket2@test.wbocrm', contact_name: 'Ticket Lead 2', metrics: {} });
    sharedLeadId = lr.body.lead_id;
  }
  const tr = await request(app)
    .post('/api/tickets')
    .set('Authorization', `Bearer ${supportToken}`)
    .send({ description: 'Pre-existing ticket', priority_level: 'Low', lead_id: sharedLeadId });
  assert.strictEqual(tr.status, 201);
  sharedTicketId = tr.body.ticket_id;
  lastResponse = tr;
});

// ── When ──────────────────────────────────────────────────────────
When('I submit a new lead with email {string} and name {string}', async (email, name) => {
  lastResponse = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesToken}`)
    .send({ email, contact_name: name, metrics: {} });
  if (lastResponse.status === 201) sharedLeadId = lastResponse.body.lead_id;
});

When('I log in with email {string} and password {string}', async (email, password) => {
  lastResponse = await request(app)
    .post('/api/auth/login')
    .send({ user_email: email, user_password: password });
});

When('I request the leads list without a token', async () => {
  lastResponse = await request(app).get('/api/leads');
});

When('I request the leads list', async () => {
  lastResponse = await request(app)
    .get('/api/leads')
    .set('Authorization', `Bearer ${supportToken}`);
});

When('I create a ticket with description {string} and priority {string}', async (desc, priority) => {
  lastResponse = await request(app)
    .post('/api/tickets')
    .set('Authorization', `Bearer ${supportToken}`)
    .send({ description: desc, priority_level: priority, lead_id: sharedLeadId });
  if (lastResponse.status === 201) sharedTicketId = lastResponse.body.ticket_id;
});

When('I update the ticket status to {string}', async (status) => {
  lastResponse = await request(app)
    .put(`/api/tickets/${sharedTicketId}`)
    .set('Authorization', `Bearer ${supportToken}`)
    .send({ status, updated_at: lastResponse.body.updated_at });
});

When('I create a lead with metrics calls {int} meetings {int} budget {string} companySize {string} emailOpens {int}', async (calls, meetings, budgetLabel, companySize, emailOpens) => {
  const budgetMap = { low: 10, medium: 50, high: 90 };
  const budget = budgetMap[budgetLabel] ?? Number(budgetLabel);
  const email = `bdd_score_${Date.now()}@test.wbocrm`;
  lastResponse = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesToken}`)
    .send({
      email,
      contact_name: 'Score Lead',
      metrics: { calls, meetings, budget, companySize, emailOpens },
    });
  if (lastResponse.status === 201) sharedLeadId = lastResponse.body.lead_id;
});

When('I retrieve all leads', async () => {
  lastResponse = await request(app)
    .get('/api/leads')
    .set('Authorization', `Bearer ${salesToken}`);
});

// ── Then ──────────────────────────────────────────────────────────
Then('the response status should be {int}', (status) => {
  assert.strictEqual(lastResponse.status, status);
});

Then('the response should contain a lead_id', () => {
  assert.ok(lastResponse.body.lead_id, 'Expected lead_id in response');
});

Then('the response should contain a ticket_id', () => {
  assert.ok(lastResponse.body.ticket_id, 'Expected ticket_id in response');
});

Then('the response error should be {string}', (errorCode) => {
  assert.strictEqual(lastResponse.body.error, errorCode);
});

Then('the response should contain a token', () => {
  assert.ok(lastResponse.body.token, 'Expected token in response');
});

Then('the token payload should include role {string}', (role) => {
  const payload = jwt.decode(lastResponse.body.token);
  assert.strictEqual(payload.rbac_role, role);
});

Then('the ticket status should be {string}', (status) => {
  assert.strictEqual(lastResponse.body.status, status);
});

Then('the lead priority_score should be greater than {int}', (threshold) => {
  assert.ok(
    Number(lastResponse.body.priority_score) > threshold,
    `Expected score > ${threshold}, got ${lastResponse.body.priority_score}`
  );
});

Then('the lead priority_score should be less than {int}', (threshold) => {
  assert.ok(
    Number(lastResponse.body.priority_score) < threshold,
    `Expected score < ${threshold}, got ${lastResponse.body.priority_score}`
  );
});

Then('leads should be ordered by priority_score descending', () => {
  const scores = lastResponse.body.map(l => Number(l.priority_score));
  for (let i = 1; i < scores.length; i++) {
    assert.ok(
      scores[i - 1] >= scores[i],
      `Score at index ${i - 1} (${scores[i - 1]}) < score at index ${i} (${scores[i]})`
    );
  }
});
