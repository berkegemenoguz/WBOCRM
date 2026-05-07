require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./src/db/pool');
const app = require('./src/app');
const { scheduleArchiveJob } = require('./src/services/archiveService');

const PORT = process.env.PORT || 3000;

async function startServer() {
  const sql = fs.readFileSync(path.join(__dirname, 'src/db/schema.sql'), 'utf8');
  await pool.query(sql);
  scheduleArchiveJob();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
