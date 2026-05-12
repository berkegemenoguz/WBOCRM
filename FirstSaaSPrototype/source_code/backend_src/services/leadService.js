const leadRepository = require('../repositories/leadRepository');
const logRepository  = require('../repositories/logRepository');
const scoringService = require('./scoringService');

const VALID_STAGES     = ['New', 'Contacted', 'Qualified', 'Closed'];
const VALID_SIZES      = ['small', 'medium', 'enterprise'];
const METRIC_FIELDS    = ['calls', 'meetings', 'budget', 'emailOpens'];

// Validates engagement metrics — throws INVALID_METRICS on failure
function validateMetrics(metrics = {}) {
  for (const field of METRIC_FIELDS) {
    const val = metrics[field];
    if (val !== undefined && (typeof val !== 'number' || val < 0)) {
      const err = new Error(`Metric "${field}" must be a non-negative number`);
      err.code = 'INVALID_METRICS';
      throw err;
    }
  }
  if (metrics.companySize !== undefined && !VALID_SIZES.includes(metrics.companySize)) {
    const err = new Error(`companySize must be one of: ${VALID_SIZES.join(', ')}`);
    err.code = 'INVALID_METRICS';
    throw err;
  }
}

async function getAll() {
  return leadRepository.findAll();
}

async function getById(id) {
  const lead = await leadRepository.findById(id);
  if (!lead) {
    const err = new Error('Lead not found');
    err.code = 'LEAD_NOT_FOUND';
    throw err;
  }
  return lead;
}

async function createLead({ email, contact_name, metrics, deal_value, campaign_id, user_id }) {
  validateMetrics(metrics);
  const existing = await leadRepository.findByEmail(email);
  if (existing) {
    const err = new Error('Duplicate email');
    err.code = 'DUPLICATE_EMAIL';
    err.lead_id = existing.lead_id;
    throw err;
  }

  const priority_score = scoringService.calculateScore(metrics || {});
  const { calls = 0, meetings = 0, budget = 0, companySize = 'small', emailOpens = 0 } = metrics || {};
  return leadRepository.create({ email, contact_name, priority_score, deal_value, campaign_id, calls, meetings, budget, company_size: companySize, email_opens: emailOpens, user_id });
}

async function updateLead(id, fields) {
  if (fields.pipeline_stage && !VALID_STAGES.includes(fields.pipeline_stage)) {
    const err = new Error(`pipeline_stage must be one of: ${VALID_STAGES.join(', ')}`);
    err.code = 'INVALID_STAGE';
    throw err;
  }

  // Recalculate score if metrics provided
  if (fields.metrics) {
    validateMetrics(fields.metrics);
    fields.priority_score = scoringService.calculateScore(fields.metrics);
    const { calls = 0, meetings = 0, budget = 0, companySize = 'small', emailOpens = 0 } = fields.metrics;
    fields.calls = calls;
    fields.meetings = meetings;
    fields.budget = budget;
    fields.company_size = companySize;
    fields.email_opens = emailOpens;
    delete fields.metrics;
  }

  const lead = await leadRepository.update(id, fields);
  if (!lead) {
    const err = new Error('Lead not found');
    err.code = 'LEAD_NOT_FOUND';
    throw err;
  }
  return lead;
}

async function deleteLead(id) {
  // Remove dependent rows first (handles DBs that may not yet have CASCADE constraint)
  await leadRepository.removeRelated(id);
  const deleted = await leadRepository.remove(id);
  if (!deleted) {
    const err = new Error('Lead not found');
    err.code = 'LEAD_NOT_FOUND';
    throw err;
  }
}

async function erasePersonalData(id) {
  const erased = await leadRepository.erasePersonalData(id);
  if (!erased) {
    const err = new Error('Lead not found');
    err.code = 'LEAD_NOT_FOUND';
    throw err;
  }
}

async function getLogs(leadId) {
  await getById(leadId);
  return logRepository.findByLead(leadId);
}

async function addLog({ leadId, note_text, user_id }) {
  await getById(leadId);
  return logRepository.create({ note_text, lead_id: leadId, user_id });
}

module.exports = { getAll, getById, createLead, updateLead, deleteLead, erasePersonalData, getLogs, addLog };
