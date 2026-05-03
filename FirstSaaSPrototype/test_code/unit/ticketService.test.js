jest.mock('../../src/repositories/ticketRepository');
jest.mock('../../src/db/pool');

const ticketRepository = require('../../src/repositories/ticketRepository');
const ticketService    = require('../../src/services/ticketService');

describe('ticketService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createTicket', () => {
    test('creates ticket with valid priority_level', async () => {
      ticketRepository.create.mockResolvedValue({ ticket_id: 1, priority_level: 'High', status: 'Open' });

      const ticket = await ticketService.createTicket({
        description: 'Test issue', priority_level: 'High', lead_id: 1, user_id: 1
      });
      expect(ticket.priority_level).toBe('High');
    });

    test('throws INVALID_PRIORITY for unknown priority_level', async () => {
      await expect(
        ticketService.createTicket({ description: 'x', priority_level: 'Critical', lead_id: 1, user_id: 1 })
      ).rejects.toMatchObject({ code: 'INVALID_PRIORITY' });
    });

    test('created ticket has default status Open', async () => {
      ticketRepository.create.mockResolvedValue({ ticket_id: 2, priority_level: 'Low', status: 'Open' });

      const ticket = await ticketService.createTicket({
        description: 'Another issue', priority_level: 'Low', lead_id: 1, user_id: 1
      });
      expect(ticket.status).toBe('Open');
    });
  });

  describe('updateTicket', () => {
    test('throws INVALID_STATUS for unknown status', async () => {
      ticketRepository.findById.mockResolvedValue({ ticket_id: 1, updated_at: new Date() });

      await expect(
        ticketService.updateTicket(1, { status: 'Pending' })
      ).rejects.toMatchObject({ code: 'INVALID_STATUS' });
    });

    test('throws CONFLICT when updated_at does not match', async () => {
      const dbTime     = new Date('2024-01-01T10:00:00.000Z');
      const clientTime = new Date('2024-01-01T09:00:00.000Z');
      ticketRepository.findById.mockResolvedValue({ ticket_id: 1, updated_at: dbTime });

      await expect(
        ticketService.updateTicket(1, { status: 'Resolved', updated_at: clientTime })
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    test('throws TICKET_NOT_FOUND when ticket does not exist', async () => {
      ticketRepository.findById.mockResolvedValue(null);

      await expect(
        ticketService.updateTicket(999, { status: 'Resolved' })
      ).rejects.toMatchObject({ code: 'TICKET_NOT_FOUND' });
    });
  });
});
