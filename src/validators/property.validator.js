const { body } = require('express-validator');

const createPropertyValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isNumeric().withMessage('Price must be a number')
    .custom((value) => value > 0).withMessage('Price must be greater than 0'),
  
  body('location.city')
    .optional({ checkFalsy: true })
    .trim(),
  
  body('location.area')
    .optional({ checkFalsy: true })
    .trim(),
    
  body('location.address')
    .optional({ checkFalsy: true })
    .trim(),
    
  body('propertyType')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['apartment', 'house', 'land', 'commercial', 'office', 'shop', 'warehouse', 'villa', 'duplex', 'penthouse']).withMessage('Invalid property type'),
    
  body('listingType')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['sale', 'rent']).withMessage('Invalid listing type'),
    
  body('bedrooms')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Bedrooms must be a positive integer'),
    
  body('bathrooms')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Bathrooms must be a positive integer'),
    
  body('area')
    .optional({ checkFalsy: true })
    .isNumeric().withMessage('Area must be a number'),

  body('amenities')
    .optional({ checkFalsy: true })
    .isArray().withMessage('Amenities must be an array'),

  body('features')
    .optional({ checkFalsy: true })
    .isArray().withMessage('Features must be an array'),
];

const updatePropertyValidator = [
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  
  body('price')
    .optional({ checkFalsy: true })
    .isNumeric().withMessage('Price must be a number')
    .custom((value) => value > 0).withMessage('Price must be greater than 0'),

  body('propertyType')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['apartment', 'house', 'land', 'commercial', 'office', 'shop', 'warehouse', 'villa', 'duplex', 'penthouse']).withMessage('Invalid property type'),
    
  body('listingType')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['sale', 'rent']).withMessage('Invalid listing type'),

  body('location.city').optional({ checkFalsy: true }).trim(),
  body('location.area').optional({ checkFalsy: true }).trim(),
  body('location.address').optional({ checkFalsy: true }).trim(),
  body('bedrooms').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('bathrooms').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('area').optional({ checkFalsy: true }).isNumeric(),

  body('amenities')
    .optional({ checkFalsy: true })
    .isArray().withMessage('Amenities must be an array'),

  body('features')
    .optional({ checkFalsy: true })
    .isArray().withMessage('Features must be an array'),
];

module.exports = {
  createPropertyValidator,
  updatePropertyValidator
};
