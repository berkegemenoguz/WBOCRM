const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/rbacMiddleware');
const authController = require('../controllers/authController');

const router = Router();

// Auth (public)
router.post('/auth/register', authController.register);
router.post('/auth/login',    authController.login);

// Placeholder — routes will be added in Phase 4 and 5
router.get('/health', authMiddleware, (_req, res) => res.json({ status: 'ok', user: _req.user }));

module.exports = router;
