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
    .trim()
    .notEmpty().withMessage('City is required'),
  
  body('location.area')
    .trim()
    .notEmpty().withMessage('Area is required'),
    
  body('location.address')
    .trim()
    .notEmpty().withMessage('Address is required'),
    
  body('propertyType')
    .trim()
    .notEmpty().withMessage('Property type is required')
    .isIn(['apartment', 'house', 'land', 'commercial', 'office', 'shop', 'warehouse', 'villa', 'duplex', 'penthouse']).withMessage('Invalid property type'),
    
  body('listingType')
    .trim()
    .notEmpty().withMessage('Listing type is required')
    .isIn(['sale', 'rent']).withMessage('Invalid listing type'),
    
  body('bedrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bedrooms must be a positive integer'),
    
  body('bathrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bathrooms must be a positive integer'),
    
  body('area')
    .notEmpty().withMessage('Area size is required')
    .isNumeric().withMessage('Area must be a number'),

  body('amenities')
    .optional()
    .isArray().withMessage('Amenities must be an array'),

  body('features')
    .optional()
    .isArray().withMessage('Features must be an array'),
    
  // Prevent mass assignment of sensitive fields
  body('views').not().exists().withMessage('Cannot set views manually'),
  body('slug').not().exists().withMessage('Cannot set slug manually'),
  body('agent').not().exists().withMessage('Cannot set agent manually'),
  body('isVerified').not().exists().withMessage('Cannot set verification status manually'),
];

const updatePropertyValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  
  body('price')
    .optional()
    .isNumeric().withMessage('Price must be a number')
    .custom((value) => value > 0).withMessage('Price must be greater than 0'),

  body('propertyType')
    .optional()
    .trim()
    .isIn(['apartment', 'house', 'land', 'commercial', 'office', 'shop', 'warehouse', 'villa', 'duplex', 'penthouse']).withMessage('Invalid property type'),
    
  body('listingType')
    .optional()
    .trim()
    .isIn(['sale', 'rent']).withMessage('Invalid listing type'),

  body('amenities')
    .optional()
    .isArray().withMessage('Amenities must be an array'),

  body('features')
    .optional()
    .isArray().withMessage('Features must be an array'),
    
  // Prevent mass assignment of sensitive fields
  body('views').not().exists().withMessage('Cannot update views manually'),
  body('slug').not().exists().withMessage('Cannot update slug manually'),
  body('agent').not().exists().withMessage('Cannot update agent manually'),
  body('createdAt').not().exists().withMessage('Cannot update creation date'),
];

module.exports = {
  createPropertyValidator,
  updatePropertyValidator
};
