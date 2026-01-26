const { body } = require('express-validator');

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .trim()
    .isMobilePhone().withMessage('Please provide a valid phone number'),
    
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    
  body('specialization')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Specialization cannot exceed 100 characters'),
    
  body('experience')
    .optional()
    .isNumeric().withMessage('Experience must be a number (years)'),
    
  // Prevent updating sensitive fields via profile update
  body('email').not().exists().withMessage('Cannot update email via profile endpoint'),
  body('password').not().exists().withMessage('Cannot update password via profile endpoint'),
  body('role').not().exists().withMessage('Cannot update role manually'),
  body('isVerified').not().exists().withMessage('Cannot update verification status manually'),
];

module.exports = {
  updateProfileValidator,
};
