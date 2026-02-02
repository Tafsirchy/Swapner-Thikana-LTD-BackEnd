const { verifyToken } = require('../utils/jwt');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const ApiResponse = require('../utils/apiResponse');

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Token found in Authorization header');
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('Token found in HTTP-only cookie');
  }

  if (!token) {
    console.log('No token found in request headers or cookies');
    return ApiResponse.error(res, 'Not authorized to access this route', 401);
  }

  try {
    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtError) {
      console.error(`[DEBUG] JWT Verification Failed: ${jwtError.message}`);
      return ApiResponse.error(res, 'Not authorized: Invalid or expired token', 401);
    }

    // Get database instance
    const db = getDB();

    // Get user from token
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      console.error(`[DEBUG] User lookup failed for ID: ${decoded.id}`);
      return ApiResponse.error(res, 'User not found or account deactivated', 401);
    }

    if (!user.isActive) {
      console.error(`[DEBUG] User account deactivated: ${user.email}`);
      return ApiResponse.error(res, 'Account has been deactivated', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`[DEBUG] Auth Middleware Unexpected Error: ${error.message}`);
    return ApiResponse.error(res, 'Not authorized to access this route', 401);
  }
};

module.exports = { protect };
