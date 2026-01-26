const { body } = require('express-validator');

const createProjectValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  
  body('location.city')
    .trim()
    .notEmpty().withMessage('City is required'),
    
  body('location.address')
    .trim()
    .notEmpty().withMessage('Address is required'),
    
  body('type')
    .trim()
    .notEmpty().withMessage('Project type is required')
    .isIn(['residential', 'commercial', 'mixed']).withMessage('Invalid project type'),
    
  body('status')
    .optional()
    .trim()
    .isIn(['ongoing', 'completed', 'upcoming']).withMessage('Invalid status'),

  body('features')
    .optional()
    .isArray().withMessage('Features must be an array'),
    
  // Prevent mass assignment
  body('slug').not().exists().withMessage('Cannot set slug manually'),
];

const updateProjectValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    
  body('status')
    .optional()
    .trim()
    .isIn(['ongoing', 'completed', 'upcoming']).withMessage('Invalid status'),
    
  // Prevent mass assignment
  body('slug').not().exists().withMessage('Cannot update slug manually'),
  body('createdAt').not().exists().withMessage('Cannot update creation date'),
];

module.exports = {
  createProjectValidator,
  updateProjectValidator
};
