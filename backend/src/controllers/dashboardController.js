const leadRepository   = require('../repositories/leadRepository');
const ticketRepository = require('../repositories/ticketRepository');

async function get(_req, res) {
  const [activeLeads, openTickets, top5] = await Promise.all([
    leadRepository.countActive(),
    ticketRepository.countOpen(),
    leadRepository.topByScore(5)
  ]);
  return res.status(200).json({ activeLeads, openTickets, top5 });
}

module.exports = { get };
