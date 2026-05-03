const pool = require('../db/pool');

async function findByLead(leadId) {
  const { rows } = await pool.query(
    `SELECT il.*, ua.full_name
     FROM InteractionLog il
     LEFT JOIN UserAccount ua ON il.user_id = ua.user_id
     WHERE il.lead_id = $1
     ORDER BY il.timestamp DESC`,
    [leadId]
  );
  return rows;
}

async function create({ note_text, lead_id, user_id }) {
  const { rows } = await pool.query(
    `INSERT INTO InteractionLog (note_text, lead_id, user_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [note_text, lead_id, user_id]
  );
  return rows[0];
}

module.exports = { findByLead, create };
