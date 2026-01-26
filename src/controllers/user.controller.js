const { Users } = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await Users().find({}, { projection: { password: 0 } }).toArray();
    return ApiResponse.success(res, 'Users fetched', { users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, bio, specialization, experience } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;

    // Agent specific fields
    if (req.user.role === 'agent') {
      if (bio) updateData.bio = bio;
      if (specialization) updateData.specialization = specialization;
      if (experience) updateData.experience = experience;
    }

    await Users().updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: updateData }
    );

    const updatedUser = await Users().findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { password: 0 } }
    );

    return ApiResponse.success(res, 'Profile updated successfully', { user: updatedUser });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await Users().findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    return ApiResponse.success(res, 'User found', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's saved properties
 * @route   GET /api/users/saved-properties
 * @access  Private
 */
const getSavedProperties = async (req, res, next) => {
  try {
    const user = await Users().findOne({ _id: new ObjectId(req.user._id) });
    
    if (!user || !user.savedProperties || user.savedProperties.length === 0) {
      return ApiResponse.success(res, 'No saved properties found', { properties: [] });
    }

    // Convert string IDs to ObjectIds if necessary
    const savedIds = user.savedProperties.map(id => new ObjectId(id));

    const properties = await require('../models/Property').Properties()
      .find({ _id: { $in: savedIds } })
      .toArray();

    return ApiResponse.success(res, 'Saved properties fetched', { properties });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateProfile,
  getUserById,
  getSavedProperties,
};
