const ticketService = require('../services/ticketService');

async function getAll(_req, res) {
  const tickets = await ticketService.getAll();
  return res.status(200).json(tickets);
}

async function getById(req, res) {
  try {
    const ticket = await ticketService.getById(req.params.id);
    return res.status(200).json(ticket);
  } catch (err) {
    if (err.code === 'TICKET_NOT_FOUND') return res.status(404).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

async function create(req, res) {
  const { description, priority_level, lead_id } = req.body;
  if (!description || !priority_level || !lead_id) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'description, priority_level, and lead_id are required' });
  }

  try {
    const ticket = await ticketService.createTicket({ description, priority_level, lead_id, user_id: req.user.user_id });
    return res.status(201).json(ticket);
  } catch (err) {
    if (err.code === 'INVALID_PRIORITY') return res.status(400).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

async function update(req, res) {
  try {
    const ticket = await ticketService.updateTicket(req.params.id, req.body);
    return res.status(200).json(ticket);
  } catch (err) {
    if (err.code === 'TICKET_NOT_FOUND') return res.status(404).json({ error: err.code, message: err.message });
    if (err.code === 'INVALID_STATUS')   return res.status(400).json({ error: err.code, message: err.message });
    if (err.code === 'INVALID_PRIORITY') return res.status(400).json({ error: err.code, message: err.message });
    if (err.code === 'CONFLICT')         return res.status(409).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

async function remove(req, res) {
  try {
    await ticketService.deleteTicket(req.params.id);
    return res.status(200).json({ message: 'Ticket deleted' });
  } catch (err) {
    if (err.code === 'TICKET_NOT_FOUND') return res.status(404).json({ error: err.code, message: err.message });
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

module.exports = { getAll, getById, create, update, remove };
