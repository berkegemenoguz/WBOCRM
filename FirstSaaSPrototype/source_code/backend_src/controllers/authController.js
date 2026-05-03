const authService = require('../services/authService');

async function register(req, res) {
  const { user_email, user_password, rbac_role, full_name } = req.body;

  if (!user_email || !user_password || !rbac_role || !full_name) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'All fields are required' });
  }

  try {
    const user = await authService.register({ user_email, user_password, rbac_role, full_name });
    return res.status(201).json(user);
  } catch (err) {
    if (err.code === 'DUPLICATE_EMAIL') return res.status(400).json({ error: err.code, message: err.message });
    if (err.code === 'INVALID_EMAIL')  return res.status(400).json({ error: err.code, message: err.message });
    if (err.code === 'INVALID_ROLE')   return res.status(400).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

async function login(req, res) {
  const { user_email, user_password } = req.body;

  if (!user_email || !user_password) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and password are required' });
  }

  try {
    const result = await authService.login({ user_email, user_password });
    return res.status(200).json(result);
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') return res.status(401).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

module.exports = { register, login };
