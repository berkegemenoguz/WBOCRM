const SIZE_SCORES = { small: 5, medium: 10, enterprise: 20 };

// Returns 0-100 priority score based on engagement metrics
function calculateScore(metrics = {}) {
  const {
    calls       = 0,
    meetings    = 0,
    budget      = 0,
    companySize = 'small',
    emailOpens  = 0
  } = metrics;

  const callScore    = Math.min(calls / 20, 1) * 25;
  const meetingScore = Math.min(meetings / 5, 1) * 25;
  const budgetScore  = Math.min(budget / 100, 1) * 20;
  const sizeScore    = SIZE_SCORES[companySize] ?? SIZE_SCORES.small;
  const emailScore   = Math.min(emailOpens / 20, 1) * 10;

  return Math.round(callScore + meetingScore + budgetScore + sizeScore + emailScore);
}

module.exports = { calculateScore };
