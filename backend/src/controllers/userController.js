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

  // Prevent admin from downgrading their own role
  if (String(req.user.user_id) === String(req.params.id) && rbac_role !== 'admin') {
    return res.status(403).json({ error: 'SELF_ROLE_CHANGE', message: 'Admin cannot remove their own admin role' });
  }

  const user = await userRepository.updateRole(req.params.id, rbac_role);
  if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });

  return res.status(200).json(user);
}

// KVKK right-to-erasure — anonymise user account PII (admin only)
async function erasePersonalData(req, res) {
  // Prevent admin from erasing their own account
  if (String(req.user.user_id) === String(req.params.id)) {
    return res.status(403).json({ error: 'SELF_ERASE', message: 'Admin cannot erase their own account data' });
  }
  const erased = await userRepository.erasePersonalData(req.params.id);
  if (!erased) return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
  return res.status(200).json({ message: 'User personal data erased' });
}

module.exports = { getAll, updateRole, erasePersonalData };
