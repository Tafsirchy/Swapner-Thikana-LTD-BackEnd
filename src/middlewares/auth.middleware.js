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
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return ApiResponse.error(res, 'Not authorized to access this route', 401);
  }

  try {
    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtError) {
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
      return ApiResponse.error(res, 'User not found or account deactivated', 401);
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 'Account has been deactivated', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Not authorized to access this route', 401);
  }
};

/**
 * Optional Protect - Populate req.user if token is present, but don't fail if not
 */
const optionalProtect = async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next();
  }

  try {
    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtError) {
      // If token is invalid/expired, just move on without setting req.user
      return next();
    }

    // Get database instance
    const db = getDB();

    // Get user from token
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { password: 0 } }
    );

    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // On any other error, just move on
    next();
  }
};

module.exports = { protect, optionalProtect };
