const { Router } = require('express');
const authMiddleware    = require('../middleware/authMiddleware');
const { allowRoles }    = require('../middleware/rbacMiddleware');
const authController    = require('../controllers/authController');
const leadController    = require('../controllers/leadController');
const logController     = require('../controllers/logController');
const ticketController     = require('../controllers/ticketController');
const dashboardController  = require('../controllers/dashboardController');
const userController       = require('../controllers/userController');

const router = Router();

// Auth (public)
router.post('/auth/register', authController.register);
router.post('/auth/login',    authController.login);

// One-time setup endpoint — seeds demo data
router.post('/setup', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const pool   = require('../db/pool');
    const adminHash   = await bcrypt.hash('Admin123!', 12);
    const salesHash   = await bcrypt.hash('Sales123!', 12);
    const supportHash = await bcrypt.hash('Support123!', 12);
    const { rows: users } = await pool.query(`
      INSERT INTO UserAccount (user_email, user_password, rbac_role, full_name) VALUES
        ('admin@crm.com',   $1, 'admin',   'System Admin'),
        ('sales@crm.com',   $2, 'sales',   'Sales Rep'),
        ('support@crm.com', $3, 'support', 'Support Staff')
      ON CONFLICT (user_email) DO NOTHING
      RETURNING user_id, rbac_role
    `, [adminHash, salesHash, supportHash]);
    const salesUser   = users.find(u => u.rbac_role === 'sales');
    const supportUser = users.find(u => u.rbac_role === 'support');
    if (salesUser) {
      const { rows: leads } = await pool.query(`
        INSERT INTO Lead (email, contact_name, priority_score, pipeline_stage, user_id) VALUES
          ('alice@example.com', 'Alice Johnson', 85.00, 'Qualified', $1),
          ('bob@example.com',   'Bob Smith',     62.50, 'Contacted', $1),
          ('carol@example.com', 'Carol White',   91.00, 'New',       $1),
          ('dave@example.com',  'Dave Brown',    45.00, 'New',       $1),
          ('eve@example.com',   'Eve Davis',     73.00, 'Contacted', $1)
        ON CONFLICT (email) DO NOTHING RETURNING lead_id
      `, [salesUser.user_id]);
      if (leads.length >= 2 && supportUser) {
        await pool.query(`
          INSERT INTO SupportTicket (description, priority_level, status, lead_id, user_id) VALUES
            ('Cannot log into account',  'High',   'Open',        $1, $3),
            ('Invoice amount incorrect', 'Medium', 'In Progress', $2, $3)
          ON CONFLICT DO NOTHING
        `, [leads[0].lead_id, leads[1].lead_id, supportUser.user_id]);
      }
    }
    res.json({ message: 'Setup complete' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leads (read: all roles; write: sales + admin only)
router.get('/leads/export/csv', authMiddleware, allowRoles('sales', 'admin'), leadController.exportCsv);
router.get('/leads',            authMiddleware, allowRoles('sales', 'admin', 'support'), leadController.getAll);
router.post('/leads',           authMiddleware, allowRoles('sales', 'admin'), leadController.create);
router.get('/leads/:id',        authMiddleware, allowRoles('sales', 'admin', 'support'), leadController.getById);
router.put('/leads/:id',        authMiddleware, allowRoles('sales', 'admin'), leadController.update);
router.delete('/leads/:id',     authMiddleware, allowRoles('sales', 'admin'), leadController.remove);

// Interaction logs
router.get('/leads/:id/logs',  authMiddleware, logController.getByLead);
router.post('/leads/:id/logs', authMiddleware, logController.create);

// Tickets (support + admin)
router.get('/tickets',        authMiddleware, allowRoles('support', 'admin'), ticketController.getAll);
router.post('/tickets',       authMiddleware, allowRoles('support', 'admin'), ticketController.create);
router.get('/tickets/:id',    authMiddleware, allowRoles('support', 'admin'), ticketController.getById);
router.put('/tickets/:id',    authMiddleware, allowRoles('support', 'admin'), ticketController.update);
router.delete('/tickets/:id', authMiddleware, allowRoles('support', 'admin'), ticketController.remove);

// Dashboard (all roles)
router.get('/dashboard', authMiddleware, dashboardController.get);

// Users (admin only)
router.get('/users',             authMiddleware, allowRoles('admin'), userController.getAll);
router.put('/users/:id/role',    authMiddleware, allowRoles('admin'), userController.updateRole);

module.exports = router;
