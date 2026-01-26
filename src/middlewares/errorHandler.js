const ApiResponse = require('../utils/apiResponse');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // MongoDB bad ObjectId (BSON error)
  if (err.name === 'BSONError' || err.message.includes('ObjectId')) {
    const message = 'Resource not found or invalid ID format';
    return ApiResponse.error(res, message, 400);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'Field';
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return ApiResponse.error(res, message, 400);
  }

  // Generic validation error (could be from express-validator)
  if (err.name === 'ValidationError') {
    const message = err.message || 'Validation error';
    return ApiResponse.error(res, message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token expired', 401);
  }

  // Default error
  return ApiResponse.error(
    res,
    error.message || 'Server Error',
    error.statusCode || 500
  );
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  return ApiResponse.error(res, `Route ${req.originalUrl} not found`, 404);
};

module.exports = {
  errorHandler,
  notFound,
};
