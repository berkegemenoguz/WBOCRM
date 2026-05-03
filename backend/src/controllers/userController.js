const userRepository = require('../repositories/userRepository');

const VALID_ROLES = ['sales', 'support', 'admin'];

async function getAll(_req, res) {
  const users = await userRepository.findAll();
  return res.status(200).json(users);
}

async function updateRole(req, res) {
  const { rbac_role } = req.body;
  if (!VALID_ROLES.includes(rbac_role)) {
    return res.status(400).json({ error: 'INVALID_ROLE', message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
  }

  const user = await userRepository.updateRole(req.params.id, rbac_role);
  if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });

  return res.status(200).json(user);
}

module.exports = { getAll, updateRole };
