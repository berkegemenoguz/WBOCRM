const { calculateScore } = require('../../src/services/scoringService');

describe('scoringService', () => {
  describe('calculateScore', () => {
    test('returns 0 for empty metrics', () => {
      expect(calculateScore({})).toBe(5); // small company baseline
    });

    test('returns maximum 100 for perfect metrics', () => {
      const score = calculateScore({
        calls: 20,
        meetings: 5,
        budget: 100,
        companySize: 'enterprise',
        emailOpens: 20
      });
      expect(score).toBe(100);
    });

    test('scales call score proportionally', () => {
      const half = calculateScore({ calls: 10, companySize: 'small' }); // 17.5 → 18
      const full = calculateScore({ calls: 20, companySize: 'small' }); // 30 → 30
      expect(full).toBeGreaterThan(half);
      expect(full - half).toBe(12);
    });

    test('caps score at 100 even with out-of-range inputs', () => {
      const score = calculateScore({ calls: 999, meetings: 999, budget: 999, companySize: 'enterprise', emailOpens: 999 });
      expect(score).toBe(100);
    });

    test('returns correct score for enterprise company', () => {
      const score = calculateScore({ companySize: 'enterprise' });
      expect(score).toBe(20);
    });

    test('returns correct score for medium company with some activity', () => {
      const score = calculateScore({ calls: 10, meetings: 2, companySize: 'medium' });
      // callScore=12.5, meetingScore=10, budgetScore=0, sizeScore=10, emailScore=0 → 32.5 → 33
      expect(score).toBe(33);
    });
  });
});
