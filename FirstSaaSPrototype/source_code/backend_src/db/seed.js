require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminHash   = await bcrypt.hash('Admin123!', 12);
    const salesHash   = await bcrypt.hash('Sales123!', 12);
    const supportHash = await bcrypt.hash('Support123!', 12);

    const { rows: users } = await client.query(`
      INSERT INTO UserAccount (user_email, user_password, rbac_role, full_name) VALUES
        ('admin@crm.com',   $1, 'admin',   'System Admin'),
        ('sales@crm.com',   $2, 'sales',   'Sales Rep'),
        ('support@crm.com', $3, 'support', 'Support Staff')
      ON CONFLICT (user_email) DO NOTHING
      RETURNING user_id, rbac_role
    `, [adminHash, salesHash, supportHash]);

    const salesUser   = users.find(u => u.rbac_role === 'sales');
    const supportUser = users.find(u => u.rbac_role === 'support');

    if (salesUser) {
      const { rows: leads } = await client.query(`
        INSERT INTO Lead (email, contact_name, priority_score, pipeline_stage, user_id) VALUES
          ('alice@example.com', 'Alice Johnson', 85.00, 'Qualified', $1),
          ('bob@example.com',   'Bob Smith',     62.50, 'Contacted', $1),
          ('carol@example.com', 'Carol White',   91.00, 'New',       $1),
          ('dave@example.com',  'Dave Brown',    45.00, 'New',       $1),
          ('eve@example.com',   'Eve Davis',     73.00, 'Contacted', $1)
        ON CONFLICT (email) DO NOTHING
        RETURNING lead_id
      `, [salesUser.user_id]);

      if (leads.length >= 2 && supportUser) {
        await client.query(`
          INSERT INTO SupportTicket (description, priority_level, status, lead_id, user_id) VALUES
            ('Cannot log into account',  'High',   'Open',        $1, $3),
            ('Invoice amount incorrect', 'Medium', 'In Progress', $2, $3)
          ON CONFLICT DO NOTHING
        `, [leads[0].lead_id, leads[1].lead_id, supportUser.user_id]);

        await client.query(`
          INSERT INTO InteractionLog (note_text, lead_id, user_id) VALUES
            ('Initial contact via email', $1, $2),
            ('Follow-up call scheduled',  $1, $2)
          ON CONFLICT DO NOTHING
        `, [leads[0].lead_id, salesUser.user_id]);
      }
    }

    await client.query('COMMIT');
    console.log('Seed completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
