// backend/auth/authUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate random token (for password reset, etc.)
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateToken,
  verifyToken,
  generateRandomToken
};