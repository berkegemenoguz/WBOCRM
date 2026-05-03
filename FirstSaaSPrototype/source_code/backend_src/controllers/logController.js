const leadService = require('../services/leadService');

async function getByLead(req, res) {
  try {
    const logs = await leadService.getLogs(req.params.id);
    return res.status(200).json(logs);
  } catch (err) {
    if (err.code === 'LEAD_NOT_FOUND') return res.status(404).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

async function create(req, res) {
  const { note_text } = req.body;
  if (!note_text) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'note_text is required' });
  }

  try {
    const log = await leadService.addLog({ leadId: req.params.id, note_text, user_id: req.user.user_id });
    return res.status(201).json(log);
  } catch (err) {
    if (err.code === 'LEAD_NOT_FOUND') return res.status(404).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

module.exports = { getByLead, create };
