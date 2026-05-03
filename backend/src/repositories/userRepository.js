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

module.exports = { findByEmail, create, findAll, updateRole };
