const pool = require('../db/pool');

const ARCHIVE_AFTER_DAYS = 365;
const DAILY_MS = 24 * 60 * 60 * 1000;

// Move resolved/closed tickets older than 365 days to ArchivedTicket table
async function archiveOldTickets() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: stale } = await client.query(`
      SELECT * FROM SupportTicket
      WHERE status IN ('Resolved', 'Closed')
        AND updated_at < NOW() - INTERVAL '${ARCHIVE_AFTER_DAYS} days'
    `);

    if (stale.length === 0) {
      await client.query('COMMIT');
      return 0;
    }

    for (const t of stale) {
      await client.query(`
        INSERT INTO ArchivedTicket
          (ticket_id, description, priority_level, status, lead_id, user_id, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (ticket_id) DO NOTHING
      `, [t.ticket_id, t.description, t.priority_level, t.status, t.lead_id, t.user_id, t.created_at, t.updated_at]);

      await client.query('DELETE FROM SupportTicket WHERE ticket_id = $1', [t.ticket_id]);
    }

    await client.query('COMMIT');
    console.log(`Archived ${stale.length} ticket(s).`);
    return stale.length;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Archive job failed:', err.message);
    return 0;
  } finally {
    client.release();
  }
}

// Schedule daily archiving run
function scheduleArchiveJob() {
  archiveOldTickets();
  setInterval(archiveOldTickets, DAILY_MS);
}

module.exports = { archiveOldTickets, scheduleArchiveJob };
