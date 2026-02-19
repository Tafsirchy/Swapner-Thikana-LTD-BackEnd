const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * Fix 4: Token lifetime reduced to 2h via JWT_EXPIRES_IN env var
 * Fix 5: tokenVersion is embedded in payload to support server-side revocation
 * @param {string} userId - User ID
 * @param {number} tokenVersion - User's current token version (default 0)
 * @returns {string} - JWT token
 */
const generateToken = (userId, tokenVersion = 0) => {
  const expiresIn = (process.env.JWT_EXPIRES_IN && process.env.JWT_EXPIRES_IN.trim()) || '2h';
  return jwt.sign({ id: userId, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
