const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const SALT_ROUNDS = 12;
const MAX_EMAIL_LENGTH = 48;
const VALID_ROLES = ['sales', 'support', 'admin'];

async function register({ user_email, user_password, rbac_role, full_name }) {
  if (!user_email || user_email.length > MAX_EMAIL_LENGTH) {
    const err = new Error(`Email must be at most ${MAX_EMAIL_LENGTH} characters`);
    err.code = 'INVALID_EMAIL';
    throw err;
  }

  if (!VALID_ROLES.includes(rbac_role)) {
    const err = new Error('Invalid role');
    err.code = 'INVALID_ROLE';
    throw err;
  }

  const existing = await userRepository.findByEmail(user_email);
  if (existing) {
    const err = new Error('Email already registered');
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }

  const hashed = await bcrypt.hash(user_password, SALT_ROUNDS);
  return userRepository.create({ user_email, user_password: hashed, rbac_role, full_name });
}

async function login({ user_email, user_password }) {
  const user = await userRepository.findByEmail(user_email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const match = await bcrypt.compare(user_password, user.user_password);
  if (!match) {
    const err = new Error('Invalid credentials');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const token = jwt.sign(
    { user_id: user.user_id, user_email: user.user_email, rbac_role: user.rbac_role },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );

  return { token, user: { user_id: user.user_id, user_email: user.user_email, rbac_role: user.rbac_role, full_name: user.full_name } };
}

module.exports = { register, login };
