const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/apiResponse');

/**
 * Standard rate limiter for general auth routes (login, register)
 * 15 minutes window, 20 requests per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  legacyHeaders: false,
  standardHeaders: true,
  handler: (req, res) => {
    return ApiResponse.error(res, 'Too many login/registration attempts. Please try again later.', 429);
  }
});

/**
 * Strict rate limiter for email verification attempts
 * 15 minutes window, 10 requests per IP
 * Prevents brute forcing tokens
 */
const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  legacyHeaders: false,
  standardHeaders: true,
  handler: (req, res) => {
    return ApiResponse.error(res, 'Too many verification attempts. Please try again later.', 429);
  }
});

/**
 * Very strict rate limiter for resending verification emails
 * 1 hour window, 5 requests per IP
 * Prevents email spam/bombing
 */
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  legacyHeaders: false,
  standardHeaders: true,
  keyGenerator: (req) => {
    // Limit by email if provided, otherwise by IP
    return req.body.email || req.ip;
  },
  handler: (req, res) => {
    return ApiResponse.error(res, 'Too many resend requests. Please wait a while before trying again.', 429);
  }
});

/**
 * General API rate limiter for all routes
 * 15 minutes window, 500 requests per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  legacyHeaders: false,
  standardHeaders: true,
  handler: (req, res) => {
    return ApiResponse.error(res, 'Too many requests. Please try again later.', 429);
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  verifyEmailLimiter,
  resendLimiter
};
