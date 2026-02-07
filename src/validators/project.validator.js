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

  body('landSize').optional().trim(),
  body('floorConfiguration').optional().trim(),
  body('totalUnits').optional().trim(),
  body('unitsPerFloor').optional().trim(),
  body('facing').optional().trim(),
  body('roadWidth').optional().trim(),
  body('surroundings').optional().trim(),
  body('flatSize').optional().trim(),
  body('bedroomCount').optional().trim(),
  body('bathroomCount').optional().trim(),
  body('balconyCount').optional().trim(),
  body('unitDetails').optional().isObject(),
  body('parking').optional().trim(),
  body('lift').optional().trim(),
  body('stair').optional().trim(),
  body('commonFacilities').optional().trim(),
  body('pricePerSqFt').optional().trim(),
  body('availableFlats').optional().trim(),
  body('contact').optional().isObject(),
  body('brochureUrl').optional().isURL().withMessage('Invalid brochure URL'),
  body('mapUrl').optional().isURL().withMessage('Invalid Google Maps URL'),

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

  body('landSize').optional().trim(),
  body('floorConfiguration').optional().trim(),
  body('totalUnits').optional().trim(),
  body('unitsPerFloor').optional().trim(),
  body('facing').optional().trim(),
  body('roadWidth').optional().trim(),
  body('surroundings').optional().trim(),
  body('flatSize').optional().trim(),
  body('bedroomCount').optional().trim(),
  body('bathroomCount').optional().trim(),
  body('balconyCount').optional().trim(),
  body('unitDetails').optional().isObject(),
  body('parking').optional().trim(),
  body('lift').optional().trim(),
  body('stair').optional().trim(),
  body('commonFacilities').optional().trim(),
  body('pricePerSqFt').optional().trim(),
  body('availableFlats').optional().trim(),
  body('contact').optional().isObject(),
  body('brochureUrl').optional().isURL().withMessage('Invalid brochure URL'),
  body('mapUrl').optional().isURL().withMessage('Invalid Google Maps URL'),
  body('features').optional().isArray(),
    
  // Prevent mass assignment
  body('slug').not().exists().withMessage('Cannot update slug manually'),
  body('createdAt').not().exists().withMessage('Cannot update creation date'),
];

module.exports = {
  createProjectValidator,
  updateProjectValidator
};
