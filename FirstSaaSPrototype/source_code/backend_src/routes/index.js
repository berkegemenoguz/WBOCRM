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

// Leads (sales + admin)
router.get('/leads/export/csv', authMiddleware, allowRoles('sales', 'admin'), leadController.exportCsv);
router.get('/leads',            authMiddleware, allowRoles('sales', 'admin'), leadController.getAll);
router.post('/leads',           authMiddleware, allowRoles('sales', 'admin'), leadController.create);
router.get('/leads/:id',        authMiddleware, allowRoles('sales', 'admin'), leadController.getById);
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
