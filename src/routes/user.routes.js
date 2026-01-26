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

// @route   GET /api/users/agents
// @desc    Get all agents
// @access  Public
router.get('/agents', userController.getAgents);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', userController.getUserById);

module.exports = router;
