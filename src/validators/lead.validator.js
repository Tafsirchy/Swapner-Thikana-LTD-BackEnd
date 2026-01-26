const { body } = require('express-validator');

const createLeadValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
    
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Invalid phone number'),
    
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required'),
    
  body('propertyId')
    .optional()
    .isMongoId().withMessage('Invalid property ID'),
    
  body('interestType')
    .optional()
    .isIn(['property', 'project', 'general']).withMessage('Invalid interest type'),
    
  // Prevent mass assignment
  body('status').not().exists().withMessage('Cannot set status manually'),
  body('assignedTo').not().exists().withMessage('Cannot set assigned agent manually'),
];

const updateLeadStatusValidator = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['new', 'contacted', 'qualified', 'lost', 'closed']).withMessage('Invalid status'),
];

module.exports = {
  createLeadValidator,
  updateLeadStatusValidator
};
