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
    .optional({ checkFalsy: true })
    .trim(),
    
  body('location.address')
    .optional({ checkFalsy: true })
    .trim(),
    
  body('type')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['residential', 'commercial', 'mixed']).withMessage('Invalid project type'),
    
  body('status')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['ongoing', 'completed', 'upcoming']).withMessage('Invalid status'),

  body('landSize').optional({ checkFalsy: true }).trim(),
  body('floorConfiguration').optional({ checkFalsy: true }).trim(),
  body('totalUnits').optional({ checkFalsy: true }).trim(),
  body('unitsPerFloor').optional({ checkFalsy: true }).trim(),
  body('facing').optional({ checkFalsy: true }).trim(),
  body('roadWidth').optional({ checkFalsy: true }).trim(),
  body('surroundings').optional({ checkFalsy: true }).trim(),
  body('flatSize').optional({ checkFalsy: true }).trim(),
  body('bedroomCount').optional({ checkFalsy: true }).trim(),
  body('bathroomCount').optional({ checkFalsy: true }).trim(),
  body('balconyCount').optional({ checkFalsy: true }).trim(),
  body('unitDetails').optional({ checkFalsy: true }).isObject(),
  body('parking').optional({ checkFalsy: true }).trim(),
  body('lift').optional({ checkFalsy: true }).trim(),
  body('stair').optional({ checkFalsy: true }).trim(),
  body('commonFacilities').optional({ checkFalsy: true }).trim(),
  body('pricePerSqFt').optional({ checkFalsy: true }).trim(),
  body('availableFlats').optional({ checkFalsy: true }).trim(),
  body('contact').optional({ checkFalsy: true }).isObject(),
  body('handoverDate').optional({ checkFalsy: true }).trim(),
  body('thumbnail').optional({ checkFalsy: true }).trim(),
  body('brochureUrl').optional({ checkFalsy: true }).isURL().withMessage('Invalid brochure URL'),
  body('mapUrl').optional({ checkFalsy: true }).isURL().withMessage('Invalid Google Maps URL'),
  body('isHomeFeatured').optional({ checkFalsy: true }).isBoolean().withMessage('isHomeFeatured must be a boolean'),

  body('features')
    .optional({ checkFalsy: true })
    .isArray().withMessage('Features must be an array'),
];

const updateProjectValidator = [
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    
  body('location.city')
    .optional({ checkFalsy: true })
    .trim(),
    
  body('location.address')
    .optional({ checkFalsy: true })
    .trim(),
    
  body('type')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['residential', 'commercial', 'mixed']).withMessage('Invalid project type'),

  body('status')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['ongoing', 'completed', 'upcoming']).withMessage('Invalid status'),

  body('landSize').optional({ checkFalsy: true }).trim(),
  body('floorConfiguration').optional({ checkFalsy: true }).trim(),
  body('totalUnits').optional({ checkFalsy: true }).trim(),
  body('unitsPerFloor').optional({ checkFalsy: true }).trim(),
  body('facing').optional({ checkFalsy: true }).trim(),
  body('roadWidth').optional({ checkFalsy: true }).trim(),
  body('surroundings').optional({ checkFalsy: true }).trim(),
  body('flatSize').optional({ checkFalsy: true }).trim(),
  body('bedroomCount').optional({ checkFalsy: true }).trim(),
  body('bathroomCount').optional({ checkFalsy: true }).trim(),
  body('balconyCount').optional({ checkFalsy: true }).trim(),
  body('unitDetails').optional({ checkFalsy: true }).isObject(),
  body('parking').optional({ checkFalsy: true }).trim(),
  body('lift').optional({ checkFalsy: true }).trim(),
  body('stair').optional({ checkFalsy: true }).trim(),
  body('commonFacilities').optional({ checkFalsy: true }).trim(),
  body('pricePerSqFt').optional({ checkFalsy: true }).trim(),
  body('availableFlats').optional({ checkFalsy: true }).trim(),
  body('contact').optional({ checkFalsy: true }).isObject(),
  body('handoverDate').optional({ checkFalsy: true }).trim(),
  body('thumbnail').optional({ checkFalsy: true }).trim(),
  body('brochureUrl').optional({ checkFalsy: true }).isURL().withMessage('Invalid brochure URL'),
  body('mapUrl').optional({ checkFalsy: true }).isURL().withMessage('Invalid Google Maps URL'),
  body('isHomeFeatured').optional({ checkFalsy: true }).isBoolean().withMessage('isHomeFeatured must be a boolean'),
  body('features').optional({ checkFalsy: true }).isArray(),
];

module.exports = {
  createProjectValidator,
  updateProjectValidator
};
