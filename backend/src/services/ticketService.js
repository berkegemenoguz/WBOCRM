const ticketRepository = require('../repositories/ticketRepository');

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES   = ['Open', 'In Progress', 'Resolved', 'Closed'];

async function getAll() {
  return ticketRepository.findAll();
}

async function getById(id) {
  const ticket = await ticketRepository.findById(id);
  if (!ticket) {
    const err = new Error('Ticket not found');
    err.code = 'TICKET_NOT_FOUND';
    throw err;
  }
  return ticket;
}

async function createTicket({ description, priority_level, lead_id, user_id }) {
  if (!VALID_PRIORITIES.includes(priority_level)) {
    const err = new Error(`priority_level must be one of: ${VALID_PRIORITIES.join(', ')}`);
    err.code = 'INVALID_PRIORITY';
    throw err;
  }

  return ticketRepository.create({ description, priority_level, lead_id, user_id });
}

async function updateTicket(id, { status, priority_level, updated_at }) {
  if (status && !VALID_STATUSES.includes(status)) {
    const err = new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    err.code = 'INVALID_STATUS';
    throw err;
  }

  if (priority_level && !VALID_PRIORITIES.includes(priority_level)) {
    const err = new Error(`priority_level must be one of: ${VALID_PRIORITIES.join(', ')}`);
    err.code = 'INVALID_PRIORITY';
    throw err;
  }

  // Concurrent conflict detection (NFR-ST-05)
  const current = await ticketRepository.findById(id);
  if (!current) {
    const err = new Error('Ticket not found');
    err.code = 'TICKET_NOT_FOUND';
    throw err;
  }

  if (updated_at && new Date(current.updated_at).toISOString() !== new Date(updated_at).toISOString()) {
    const err = new Error('Ticket was modified by another user');
    err.code = 'CONFLICT';
    throw err;
  }

  return ticketRepository.update(id, { status, priority_level });
}

async function deleteTicket(id) {
  const deleted = await ticketRepository.remove(id);
  if (!deleted) {
    const err = new Error('Ticket not found');
    err.code = 'TICKET_NOT_FOUND';
    throw err;
  }
}

module.exports = { getAll, getById, createTicket, updateTicket, deleteTicket };
