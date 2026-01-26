const express = require('express');
const router = express.Router();

const propertyController = require('../controllers/property.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const { validate } = require('../middlewares/validation.middleware');
const { createPropertyValidator, updatePropertyValidator } = require('../validators/property.validator');

// @route   GET /api/properties
// @desc    Get all properties
// @access  Public
router.get('/', propertyController.getProperties);

// @route   GET /api/properties/my-listings
// @desc    Get my properties (Agent)
// @access  Private/Agent
router.get('/my-listings', protect, authorize('agent'), propertyController.getMyProperties);

// @route   GET /api/properties/id/:id
// @desc    Get property by ID
// @access  Public
router.get('/id/:id', propertyController.getPropertyById);

// @route   GET /api/properties/slug/:slug
// @desc    Get property by slug
// @access  Public
router.get('/slug/:slug', propertyController.getPropertyBySlug);

// @route   POST /api/properties
// @desc    Create a new property
// @access  Private/Agent/Admin
router.post('/', protect, authorize('agent', 'admin'), createPropertyValidator, validate, propertyController.createProperty);

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private/Agent/Admin
router.put('/:id', protect, authorize('agent', 'admin'), updatePropertyValidator, validate, propertyController.updateProperty);

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private/Agent/Admin
router.delete('/:id', protect, authorize('agent', 'admin'), propertyController.deleteProperty);

const upload = require('../middlewares/upload.middleware');

// @route   POST /api/properties/:id/images
// @desc    Upload property images
// @access  Private/Agent/Admin
router.post('/:id/images', protect, authorize('agent', 'admin'), upload.array('images', 10), propertyController.uploadPropertyImages);

module.exports = router;
