const bcrypt = require('bcryptjs');

jest.mock('../../src/repositories/userRepository');
jest.mock('../../src/db/pool');

const userRepository = require('../../src/repositories/userRepository');
const authService = require('../../src/services/authService');

process.env.JWT_SECRET = 'test_secret';

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register', () => {
    test('hashes password before saving', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({ user_id: 1, user_email: 'a@b.com', rbac_role: 'sales', full_name: 'Test' });

      await authService.register({ user_email: 'a@b.com', user_password: 'pass123', rbac_role: 'sales', full_name: 'Test' });

      const saved = userRepository.create.mock.calls[0][0];
      const isHashed = await bcrypt.compare('pass123', saved.user_password);
      expect(isHashed).toBe(true);
    });

    test('throws DUPLICATE_EMAIL when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ user_id: 1 });

      await expect(
        authService.register({ user_email: 'exists@b.com', user_password: 'pass', rbac_role: 'sales', full_name: 'Test' })
      ).rejects.toMatchObject({ code: 'DUPLICATE_EMAIL' });
    });

    test('throws INVALID_EMAIL when email exceeds 48 characters', async () => {
      const longEmail = 'a'.repeat(49) + '@b.com';

      await expect(
        authService.register({ user_email: longEmail, user_password: 'pass', rbac_role: 'sales', full_name: 'Test' })
      ).rejects.toMatchObject({ code: 'INVALID_EMAIL' });
    });
  });

  describe('login', () => {
    test('returns JWT token on valid credentials', async () => {
      const hashed = await bcrypt.hash('correct', 12);
      userRepository.findByEmail.mockResolvedValue({
        user_id: 1, user_email: 'u@b.com', user_password: hashed, rbac_role: 'sales', full_name: 'User'
      });

      const result = await authService.login({ user_email: 'u@b.com', user_password: 'correct' });
      expect(result.token).toBeDefined();
      expect(result.user.rbac_role).toBe('sales');
    });

    test('throws INVALID_CREDENTIALS when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ user_email: 'none@b.com', user_password: 'pass' })
      ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    });

    test('throws INVALID_CREDENTIALS when password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 12);
      userRepository.findByEmail.mockResolvedValue({
        user_id: 1, user_email: 'u@b.com', user_password: hashed, rbac_role: 'sales', full_name: 'User'
      });

      await expect(
        authService.login({ user_email: 'u@b.com', user_password: 'wrong' })
      ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    });
  });
});
