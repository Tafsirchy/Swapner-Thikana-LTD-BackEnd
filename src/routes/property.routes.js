const express = require('express');
const router = express.Router();
const {
  getProperties,
  getPropertyBySlug,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getFeaturedProperties,
  getSimilarProperties,
} = require('../controllers/property.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validation.middleware');

// Validation rules
const createPropertyValidation = [
  body('title').trim().notEmpty().withMessage('Property title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('propertyType')
    .isIn(['apartment', 'house', 'land', 'commercial', 'villa'])
    .withMessage('Invalid property type'),
  body('listingType')
    .isIn(['sale', 'rent'])
    .withMessage('Listing type must be sale or rent'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('location.city').notEmpty().withMessage('City is required'),
  body('location.area').notEmpty().withMessage('Area is required'),
  body('specs.totalArea').isNumeric().withMessage('Total area is required'),
];

// Public routes
router.get('/', getProperties); // Get all properties with filters
router.get('/featured', getFeaturedProperties); // Get featured properties
router.get('/:slug', getPropertyBySlug); // Get single property by slug
router.get('/:id/similar', getSimilarProperties); // Get similar properties

// Protected routes (Agent/Admin only)
router.post(
  '/',
  protect,
  authorize('agent', 'admin'),
  createPropertyValidation,
  validate,
  createProperty
);

router.get(
  '/my-properties',
  protect,
  authorize('agent', 'admin'),
  getMyProperties
);

router.put(
  '/:id',
  protect,
  authorize('agent', 'admin'),
  updateProperty
);

router.delete(
  '/:id',
  protect,
  authorize('agent', 'admin'),
  deleteProperty
);

module.exports = router;
