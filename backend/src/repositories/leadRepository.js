const pool = require('../db/pool');

async function findAll() {
  const { rows } = await pool.query(
    'SELECT * FROM Lead ORDER BY priority_score DESC'
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM Lead WHERE lead_id = $1', [id]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM Lead WHERE email = $1', [email]);
  return rows[0] || null;
}

async function create({ email, contact_name, priority_score, pipeline_stage = 'New', user_id }) {
  const { rows } = await pool.query(
    `INSERT INTO Lead (email, contact_name, priority_score, pipeline_stage, user_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [email, contact_name, priority_score, pipeline_stage, user_id]
  );
  return rows[0];
}

async function update(id, fields) {
  const allowed = ['contact_name', 'email', 'pipeline_stage', 'priority_score'];
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(fields[key]);
    }
  }
  if (!setClauses.length) return null;

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE Lead SET ${setClauses.join(', ')} WHERE lead_id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM Lead WHERE lead_id = $1', [id]);
  return rowCount > 0;
}

async function topByScore(limit = 5) {
  const { rows } = await pool.query(
    'SELECT * FROM Lead ORDER BY priority_score DESC LIMIT $1',
    [limit]
  );
  return rows;
}

async function countActive() {
  const { rows } = await pool.query("SELECT COUNT(*) FROM Lead WHERE pipeline_stage != 'Closed'");
  return parseInt(rows[0].count, 10);
}

module.exports = { findAll, findById, findByEmail, create, update, remove, topByScore, countActive };
