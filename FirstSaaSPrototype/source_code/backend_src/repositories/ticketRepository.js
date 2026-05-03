const pool = require('../db/pool');

async function findAll() {
  const { rows } = await pool.query(
    'SELECT * FROM SupportTicket ORDER BY created_at DESC'
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM SupportTicket WHERE ticket_id = $1',
    [id]
  );
  return rows[0] || null;
}

async function create({ description, priority_level, lead_id, user_id }) {
  const { rows } = await pool.query(
    `INSERT INTO SupportTicket (description, priority_level, lead_id, user_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [description, priority_level, lead_id, user_id]
  );
  return rows[0];
}

async function update(id, { status, priority_level }) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (status !== undefined)         { setClauses.push(`status = $${idx++}`);         values.push(status); }
  if (priority_level !== undefined) { setClauses.push(`priority_level = $${idx++}`); values.push(priority_level); }
  if (!setClauses.length) return null;

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE SupportTicket SET ${setClauses.join(', ')} WHERE ticket_id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await pool.query(
    'DELETE FROM SupportTicket WHERE ticket_id = $1',
    [id]
  );
  return rowCount > 0;
}

async function countOpen() {
  const { rows } = await pool.query(
    "SELECT COUNT(*) FROM SupportTicket WHERE status NOT IN ('Resolved', 'Closed')"
  );
  return parseInt(rows[0].count, 10);
}

module.exports = { findAll, findById, create, update, remove, countOpen };
