const leadService = require('../services/leadService');

// Mask PII fields for roles without full data access (GDPR/KVKK — NFR-ST-07)
function maskEmail(email) {
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}

function maskName(name) {
  const parts = name.trim().split(' ');
  return parts.map((p, i) => i === 0 ? `${p[0].toUpperCase()}.` : `${p[0].toUpperCase()}***`).join(' ');
}

function applyMask(lead) {
  return { ...lead, email: maskEmail(lead.email), contact_name: maskName(lead.contact_name) };
}

function maybeApplyMask(req, data) {
  if (req.user?.rbac_role !== 'support') return data;
  return Array.isArray(data) ? data.map(applyMask) : applyMask(data);
}

async function getAll(req, res) {
  const leads = await leadService.getAll();
  return res.status(200).json(maybeApplyMask(req, leads));
}

async function getById(req, res) {
  try {
    const lead = await leadService.getById(req.params.id);
    return res.status(200).json(maybeApplyMask(req, lead));
  } catch (err) {
    if (err.code === 'LEAD_NOT_FOUND') return res.status(404).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

async function create(req, res) {
  const { email, contact_name, metrics, deal_value, campaign_id } = req.body;
  if (!email || !contact_name) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'email and contact_name are required' });
  }

  try {
    const lead = await leadService.createLead({ email, contact_name, metrics, deal_value, campaign_id, user_id: req.user.user_id });
    return res.status(201).json(lead);
  } catch (err) {
    if (err.code === 'DUPLICATE_EMAIL') return res.status(409).json({ error: err.code, message: err.message, lead_id: err.lead_id });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

async function update(req, res) {
  try {
    const lead = await leadService.updateLead(req.params.id, req.body);
    return res.status(200).json(lead);
  } catch (err) {
    if (err.code === 'LEAD_NOT_FOUND') return res.status(404).json({ error: err.code, message: err.message });
    if (err.code === 'INVALID_STAGE')  return res.status(400).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    await leadService.deleteLead(req.params.id);
    return res.status(200).json({ message: 'Lead deleted' });
  } catch (err) {
    if (err.code === 'LEAD_NOT_FOUND') return res.status(404).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

// GDPR/KVKK right-to-erasure — anonymise PII and delete interaction logs
async function erasePersonalData(req, res) {
  try {
    await leadService.erasePersonalData(req.params.id);
    return res.status(200).json({ message: 'Personal data erased' });
  } catch (err) {
    if (err.code === 'LEAD_NOT_FOUND') return res.status(404).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

async function exportCsv(_req, res) {
  const leads = await leadService.getAll();
  const header = 'lead_id,contact_name,email,pipeline_stage,priority_score,deal_value,campaign_id,created_at';
  const rows = leads.map(l =>
    [l.lead_id, `"${l.contact_name}"`, l.email, l.pipeline_stage, l.priority_score, l.deal_value, l.campaign_id || '', l.created_at].join(',')
  );
  const csv = [header, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
  return res.status(200).send(csv);
}

module.exports = { getAll, getById, create, update, remove, erasePersonalData, exportCsv };
