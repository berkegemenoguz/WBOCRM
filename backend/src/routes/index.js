const { Router } = require('express');
const authMiddleware    = require('../middleware/authMiddleware');
const { allowRoles }    = require('../middleware/rbacMiddleware');
const authController    = require('../controllers/authController');
const leadController    = require('../controllers/leadController');
const logController     = require('../controllers/logController');

const router = Router();

// Auth (public)
router.post('/auth/register', authController.register);
router.post('/auth/login',    authController.login);

// Leads (sales + admin)
router.get('/leads',         authMiddleware, allowRoles('sales', 'admin'), leadController.getAll);
router.post('/leads',        authMiddleware, allowRoles('sales', 'admin'), leadController.create);
router.get('/leads/:id',     authMiddleware, allowRoles('sales', 'admin'), leadController.getById);
router.put('/leads/:id',     authMiddleware, allowRoles('sales', 'admin'), leadController.update);
router.delete('/leads/:id',  authMiddleware, allowRoles('sales', 'admin'), leadController.remove);

// Interaction logs
router.get('/leads/:id/logs',  authMiddleware, logController.getByLead);
router.post('/leads/:id/logs', authMiddleware, logController.create);

module.exports = router;
