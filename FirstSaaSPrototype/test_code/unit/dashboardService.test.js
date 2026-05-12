jest.mock('../../src/repositories/leadRepository');
jest.mock('../../src/repositories/ticketRepository');
jest.mock('../../src/db/pool');

const leadRepository   = require('../../src/repositories/leadRepository');
const ticketRepository = require('../../src/repositories/ticketRepository');

// We test the dashboard controller directly since it has inline logic
const dashboardController = require('../../src/controllers/dashboardController');

function mockReqRes(role = 'admin') {
  const req = { user: { user_id: 1, rbac_role: role } };
  const res = {
    _status: null, _json: null,
    status(s) { this._status = s; return this; },
    json(d)   { this._json = d; return this; },
  };
  return { req, res };
}

describe('dashboardController', () => {
  beforeEach(() => jest.clearAllMocks());

  /* FR-ST-11 — Active Lead Visualization */
  test('returns activeLeads count', async () => {
    leadRepository.countActive.mockResolvedValue(12);
    ticketRepository.countOpen.mockResolvedValue(3);
    leadRepository.topByScore.mockResolvedValue([]);
    leadRepository.monthlyRevenue.mockResolvedValue('0.00');

    const { req, res } = mockReqRes();
    await dashboardController.get(req, res);

    expect(res._status).toBe(200);
    expect(res._json.activeLeads).toBe(12);
  });

  /* FR-UC-12 — Pending Ticket Visualization */
  test('returns openTickets count', async () => {
    leadRepository.countActive.mockResolvedValue(5);
    ticketRepository.countOpen.mockResolvedValue(8);
    leadRepository.topByScore.mockResolvedValue([]);
    leadRepository.monthlyRevenue.mockResolvedValue('0.00');

    const { req, res } = mockReqRes();
    await dashboardController.get(req, res);

    expect(res._json.openTickets).toBe(8);
  });

  /* FR-ST-14 — Monthly Revenue Tracking */
  test('returns monthlyRevenue sum', async () => {
    leadRepository.countActive.mockResolvedValue(0);
    ticketRepository.countOpen.mockResolvedValue(0);
    leadRepository.topByScore.mockResolvedValue([]);
    leadRepository.monthlyRevenue.mockResolvedValue('45000.00');

    const { req, res } = mockReqRes();
    await dashboardController.get(req, res);

    expect(res._json.monthlyRevenue).toBe('45000.00');
  });

  /* FR-ST-11/12/14 combined — full dashboard payload */
  test('returns all four KPI fields', async () => {
    leadRepository.countActive.mockResolvedValue(10);
    ticketRepository.countOpen.mockResolvedValue(4);
    leadRepository.topByScore.mockResolvedValue([
      { lead_id: 1, contact_name: 'Top Lead', email: 'top@x.com', priority_score: 95 },
    ]);
    leadRepository.monthlyRevenue.mockResolvedValue('12500.00');

    const { req, res } = mockReqRes();
    await dashboardController.get(req, res);

    expect(res._status).toBe(200);
    expect(res._json).toHaveProperty('activeLeads', 10);
    expect(res._json).toHaveProperty('openTickets', 4);
    expect(res._json).toHaveProperty('monthlyRevenue', '12500.00');
    expect(res._json.top5).toHaveLength(1);
    expect(res._json.top5[0].contact_name).toBe('Top Lead');
  });

  /* NFR-ST-07 — PII Masking on dashboard for support role */
  test('masks top5 PII for support role', async () => {
    leadRepository.countActive.mockResolvedValue(1);
    ticketRepository.countOpen.mockResolvedValue(0);
    leadRepository.topByScore.mockResolvedValue([
      { lead_id: 1, contact_name: 'Alice Smith', email: 'alice@example.com', priority_score: 90 },
    ]);
    leadRepository.monthlyRevenue.mockResolvedValue('0.00');

    const { req, res } = mockReqRes('support');
    await dashboardController.get(req, res);

    expect(res._json.top5[0].email).toBe('a***@example.com');
    expect(res._json.top5[0].contact_name).toMatch(/^A\.\s+S\*\*\*/);
  });

  test('does NOT mask top5 PII for admin role', async () => {
    leadRepository.countActive.mockResolvedValue(1);
    ticketRepository.countOpen.mockResolvedValue(0);
    leadRepository.topByScore.mockResolvedValue([
      { lead_id: 1, contact_name: 'Alice Smith', email: 'alice@example.com', priority_score: 90 },
    ]);
    leadRepository.monthlyRevenue.mockResolvedValue('0.00');

    const { req, res } = mockReqRes('admin');
    await dashboardController.get(req, res);

    expect(res._json.top5[0].email).toBe('alice@example.com');
    expect(res._json.top5[0].contact_name).toBe('Alice Smith');
  });
});
