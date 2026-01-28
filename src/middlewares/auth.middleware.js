const { verifyToken } = require('../utils/jwt');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const ApiResponse = require('../utils/apiResponse');

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.error(res, 'Not authorized to access this route', 401);
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Get database instance
    const db = getDB();

    // Get user from token
    req.user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { password: 0 } }
    );

    if (!req.user) {
      return ApiResponse.error(res, 'User not found or account deactivated', 401);
    }

    if (!req.user.isActive) {
      return ApiResponse.error(res, 'Account has been deactivated', 403);
    }

    next();
  } catch (error) {
    return ApiResponse.error(res, 'Not authorized to access this route', 401);
  }
};

module.exports = { protect };
