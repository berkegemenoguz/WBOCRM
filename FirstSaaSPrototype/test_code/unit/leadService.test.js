jest.mock('../../src/repositories/leadRepository');
jest.mock('../../src/repositories/logRepository');
jest.mock('../../src/db/pool');

const leadRepository = require('../../src/repositories/leadRepository');
const logRepository  = require('../../src/repositories/logRepository');
const leadService    = require('../../src/services/leadService');

describe('leadService', () => {
  beforeEach(() => jest.clearAllMocks());

  /* FR-UC-05 — Pipeline Stage Management */
  describe('updateLead – pipeline stage', () => {
    test('accepts valid stage "Contacted"', async () => {
      leadRepository.update.mockResolvedValue({ lead_id: 1, pipeline_stage: 'Contacted' });

      const result = await leadService.updateLead(1, { pipeline_stage: 'Contacted' });
      expect(result.pipeline_stage).toBe('Contacted');
    });

    test('throws INVALID_STAGE for unknown stage', async () => {
      await expect(
        leadService.updateLead(1, { pipeline_stage: 'InvalidStage' })
      ).rejects.toMatchObject({ code: 'INVALID_STAGE' });
    });

    test('accepts all four valid stages', async () => {
      for (const stage of ['New', 'Contacted', 'Qualified', 'Closed']) {
        leadRepository.update.mockResolvedValue({ lead_id: 1, pipeline_stage: stage });
        const result = await leadService.updateLead(1, { pipeline_stage: stage });
        expect(result.pipeline_stage).toBe(stage);
      }
    });
  });

  /* FR-SC-06 — Lead Assignment */
  describe('updateLead – lead assignment', () => {
    test('updates user_id for lead assignment', async () => {
      leadRepository.update.mockResolvedValue({ lead_id: 1, user_id: 42 });

      const result = await leadService.updateLead(1, { user_id: 42 });
      expect(result.user_id).toBe(42);
      expect(leadRepository.update).toHaveBeenCalledWith(1, { user_id: 42 });
    });

    test('throws LEAD_NOT_FOUND when lead does not exist', async () => {
      leadRepository.update.mockResolvedValue(null);

      await expect(
        leadService.updateLead(999, { user_id: 42 })
      ).rejects.toMatchObject({ code: 'LEAD_NOT_FOUND' });
    });
  });

  /* FR-ST-04 — Interaction Logging */
  describe('addLog / getLogs', () => {
    test('addLog creates a new interaction note', async () => {
      leadRepository.findById.mockResolvedValue({ lead_id: 1 });
      logRepository.create.mockResolvedValue({ log_id: 10, note_text: 'Called client', lead_id: 1 });

      const result = await leadService.addLog({ leadId: 1, note_text: 'Called client', user_id: 5 });
      expect(result.log_id).toBe(10);
      expect(result.note_text).toBe('Called client');
      expect(logRepository.create).toHaveBeenCalledWith({ note_text: 'Called client', lead_id: 1, user_id: 5 });
    });

    test('addLog throws LEAD_NOT_FOUND for missing lead', async () => {
      leadRepository.findById.mockResolvedValue(null);

      await expect(
        leadService.addLog({ leadId: 999, note_text: 'test', user_id: 1 })
      ).rejects.toMatchObject({ code: 'LEAD_NOT_FOUND' });
    });

    test('getLogs returns interaction logs for a lead', async () => {
      leadRepository.findById.mockResolvedValue({ lead_id: 1 });
      logRepository.findByLead.mockResolvedValue([
        { log_id: 1, note_text: 'First call', timestamp: '2026-01-01' },
        { log_id: 2, note_text: 'Follow-up email', timestamp: '2026-01-02' },
      ]);

      const logs = await leadService.getLogs(1);
      expect(logs).toHaveLength(2);
      expect(logs[0].note_text).toBe('First call');
    });
  });

  /* FR-SC-13 — Campaign Tracking */
  describe('createLead – campaign tracking', () => {
    test('stores campaign_id when creating a lead', async () => {
      leadRepository.findByEmail.mockResolvedValue(null);
      leadRepository.create.mockResolvedValue({ lead_id: 1, campaign_id: 'CAMP-2026-Q1' });

      const result = await leadService.createLead({
        email: 'camp@test.com', contact_name: 'Camp Lead',
        metrics: {}, deal_value: 0, campaign_id: 'CAMP-2026-Q1', user_id: 1
      });
      expect(result.campaign_id).toBe('CAMP-2026-Q1');
    });
  });

  /* NFR-ST-07 — GDPR/KVKK Erasure */
  describe('erasePersonalData', () => {
    test('anonymises lead PII successfully', async () => {
      leadRepository.erasePersonalData.mockResolvedValue({ lead_id: 5, email: 'erased_5@erased.invalid', contact_name: '[Erased]' });

      await expect(leadService.erasePersonalData(5)).resolves.not.toThrow();
      expect(leadRepository.erasePersonalData).toHaveBeenCalledWith(5);
    });

    test('throws LEAD_NOT_FOUND for missing lead', async () => {
      leadRepository.erasePersonalData.mockResolvedValue(null);

      await expect(
        leadService.erasePersonalData(999)
      ).rejects.toMatchObject({ code: 'LEAD_NOT_FOUND' });
    });
  });

  /* Metric validation */
  describe('createLead – metric validation', () => {
    test('throws INVALID_METRICS for negative calls', async () => {
      await expect(
        leadService.createLead({ email: 'x@y.com', contact_name: 'X', metrics: { calls: -1 } })
      ).rejects.toMatchObject({ code: 'INVALID_METRICS' });
    });

    test('throws INVALID_METRICS for invalid companySize', async () => {
      await expect(
        leadService.createLead({ email: 'x@y.com', contact_name: 'X', metrics: { companySize: 'huge' } })
      ).rejects.toMatchObject({ code: 'INVALID_METRICS' });
    });
  });
});
