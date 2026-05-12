const leadRepository   = require('../repositories/leadRepository');
const ticketRepository = require('../repositories/ticketRepository');

// Mask PII for support role (NFR-ST-07)
function maskLead(lead) {
  const [local, domain] = lead.email.split('@');
  const parts = lead.contact_name.trim().split(' ');
  return {
    ...lead,
    email:        `${local[0]}***@${domain}`,
    contact_name: parts.map((p, i) => i === 0 ? `${p[0].toUpperCase()}.` : `${p[0].toUpperCase()}***`).join(' '),
  };
}

async function get(req, res) {
  const [activeLeads, openTickets, top5raw, monthlyRevenue] = await Promise.all([
    leadRepository.countActive(),
    ticketRepository.countOpen(),
    leadRepository.topByScore(5),
    leadRepository.monthlyRevenue(),
  ]);
  const top5 = req.user?.rbac_role === 'support' ? top5raw.map(maskLead) : top5raw;
  return res.status(200).json({ activeLeads, openTickets, top5, monthlyRevenue });
}

module.exports = { get };
