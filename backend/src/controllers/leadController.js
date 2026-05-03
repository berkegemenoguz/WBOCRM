const leadService = require('../services/leadService');

async function getAll(_req, res) {
  const leads = await leadService.getAll();
  return res.status(200).json(leads);
}

async function getById(req, res) {
  try {
    const lead = await leadService.getById(req.params.id);
    return res.status(200).json(lead);
  } catch (err) {
    if (err.code === 'LEAD_NOT_FOUND') return res.status(404).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

async function create(req, res) {
  const { email, contact_name, metrics } = req.body;
  if (!email || !contact_name) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'email and contact_name are required' });
  }

  try {
    const lead = await leadService.createLead({ email, contact_name, metrics, user_id: req.user.user_id });
    return res.status(201).json(lead);
  } catch (err) {
    if (err.code === 'DUPLICATE_EMAIL') return res.status(400).json({ error: err.code, message: err.message });
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

module.exports = { getAll, getById, create, update, remove };
