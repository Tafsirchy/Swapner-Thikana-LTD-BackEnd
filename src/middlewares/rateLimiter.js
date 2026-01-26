const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/apiResponse');

/**
 * Standard rate limiter for all API requests
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    return ApiResponse.error(
      res, 
      'Too many requests from this IP, please try again after 15 minutes', 
      429
    );
  },
});

/**
 * Stricter rate limiter for sensitive endpoints (auth)
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res, 
      'Too many auth attempts, please try again after an hour', 
      429
    );
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
