const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
const { validate } = require('../middlewares/validation.middleware');
const { updateProfileValidator } = require('../validators/user.validator');

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), userController.getUsers);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfileValidator, validate, userController.updateProfile);

// @route   GET /api/users/saved-properties
// @desc    Get saved properties
// @access  Private
router.get('/saved-properties', protect, userController.getSavedProperties);

// @route   POST /api/users/saved-properties/:propertyId
// @desc    Add property to saved/wishlist
// @access  Private
router.post('/saved-properties/:propertyId', protect, userController.addToWishlist);

// @route   DELETE /api/users/saved-properties/:propertyId
// @desc    Remove property from saved/wishlist
// @access  Private
router.delete('/saved-properties/:propertyId', protect, userController.removeFromWishlist);

// @route   GET /api/users/agents
// @access  Public
router.get('/agents', userController.getAgents);

// @route   GET /api/users/recently-viewed
// @desc    Get recently viewed properties
// @access  Private
router.get('/recently-viewed', protect, userController.getRecentlyViewed);

// @route   POST /api/users/recently-viewed/:propertyId
// @desc    Add property to recently viewed
// @access  Private
router.post('/recently-viewed/:propertyId', protect, userController.addRecentlyViewed);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', userController.getUserById);

module.exports = router;
