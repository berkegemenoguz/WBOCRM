require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Database schema initialized.');
  } finally {
    client.release();
    await pool.end();
  }
}

initDb().catch(err => {
  console.error('Schema init failed:', err.message);
  process.exit(1);
});
