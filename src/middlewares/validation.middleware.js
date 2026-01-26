const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

/**
 * Validation middleware to check for validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return ApiResponse.error(res, 'Validation failed', 400, errorMessages);
  }
  
  next();
};

module.exports = { validate };
