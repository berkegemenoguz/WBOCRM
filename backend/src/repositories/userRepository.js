const pool = require('../db/pool');

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM UserAccount WHERE user_email = $1',
    [email]
  );
  return rows[0] || null;
}

async function create({ user_email, user_password, rbac_role, full_name }) {
  const { rows } = await pool.query(
    `INSERT INTO UserAccount (user_email, user_password, rbac_role, full_name)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, user_email, rbac_role, full_name`,
    [user_email, user_password, rbac_role, full_name]
  );
  return rows[0];
}

async function findById(userId) {
  const { rows } = await pool.query(
    'SELECT user_id, user_email, rbac_role, full_name FROM UserAccount WHERE user_id = $1',
    [userId]
  );
  return rows[0] || null;
}

async function findAll() {
  const { rows } = await pool.query(
    'SELECT user_id, user_email, rbac_role, full_name FROM UserAccount ORDER BY user_id'
  );
  return rows;
}

async function updateRole(userId, rbac_role) {
  const { rows } = await pool.query(
    `UPDATE UserAccount SET rbac_role = $1 WHERE user_id = $2
     RETURNING user_id, user_email, rbac_role, full_name`,
    [rbac_role, userId]
  );
  return rows[0] || null;
}

// Count users with admin role
async function countAdmins() {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS cnt FROM UserAccount WHERE rbac_role = 'admin'"
  );
  return rows[0].cnt;
}

// Anonymise PII — KVKK right-to-erasure
async function erasePersonalData(userId) {
  const { rowCount } = await pool.query(
    `UPDATE UserAccount SET user_email = 'erased_' || user_id || '@erased.invalid', full_name = '[Erased]' WHERE user_id = $1`,
    [userId]
  );
  return rowCount > 0;
}

module.exports = { findByEmail, findById, create, findAll, updateRole, countAdmins, erasePersonalData };
