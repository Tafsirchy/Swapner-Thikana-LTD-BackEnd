const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
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

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return ApiResponse.error(res, 'User not found', 404);
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
