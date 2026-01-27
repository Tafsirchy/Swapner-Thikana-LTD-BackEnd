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
 * @desc    Get all agents (Public)
 * @route   GET /api/users/agents
 * @access  Public
 */
const getAgents = async (req, res, next) => {
  try {
    const agents = await Users().find(
      { role: 'agent' }, 
      { projection: { password: 0, savedProperties: 0, createdAt: 0, updatedAt: 0 } }
    ).toArray();
    
    return ApiResponse.success(res, 'Agents fetched', { agents });
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
    const { Properties } = require('../models/Property');
    
    const user = await Users().findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { savedProperties: 1 } }
    );

    if (!user || !user.savedProperties || user.savedProperties.length === 0) {
      return ApiResponse.success(res, 'No saved properties', { properties: [] });
    }

    const savedPropertyIds = user.savedProperties.map(id => new ObjectId(id));
    const properties = await Properties().find({
      _id: { $in: savedPropertyIds }
    }).toArray();

    return ApiResponse.success(res, 'Saved properties fetched', { properties });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add property to wishlist
 * @route   POST /api/users/saved-properties/:propertyId
 * @access  Private
 */
const addToWishlist = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { Properties } = require('../models/Property');

    // Check if property exists
    const property = await Properties().findOne({ _id: new ObjectId(propertyId) });
    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    // Check if already saved
    const user = await Users().findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { savedProperties: 1 } }
    );

    if (user.savedProperties && user.savedProperties.some(id => id.toString() === propertyId)) {
      return ApiResponse.error(res, 'Property already in wishlist', 400);
    }

    // Add to savedProperties array
    await Users().updateOne(
      { _id: new ObjectId(req.user._id) },
      { $addToSet: { savedProperties: new ObjectId(propertyId) } }
    );

    return ApiResponse.success(res, 'Property added to wishlist', { propertyId });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove property from wishlist
 * @route   DELETE /api/users/saved-properties/:propertyId
 * @access  Private
 */
const removeFromWishlist = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    // Remove from savedProperties array
    await Users().updateOne(
      { _id: new ObjectId(req.user._id) },
      { $pull: { savedProperties: new ObjectId(propertyId) } }
    );

    return ApiResponse.success(res, 'Property removed from wishlist');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add property to recently viewed
 * @route   POST /api/users/recently-viewed/:propertyId
 * @access  Private
 */
const addRecentlyViewed = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const userId = new ObjectId(req.user._id);

    // Filter out current property if it exists, push to front, then slice
    await Users().updateOne(
      { _id: userId },
      [
        {
          $set: {
            recentlyViewed: {
              $slice: [
                {
                  $concatArrays: [
                    [new ObjectId(propertyId)],
                    {
                      $filter: {
                        input: { $ifNull: ["$recentlyViewed", []] },
                        as: "id",
                        cond: { $ne: ["$$id", new ObjectId(propertyId)] }
                      }
                    }
                  ]
                },
                10 // Limit to 10 items
              ]
            }
          }
        }
      ]
    );

    return ApiResponse.success(res, 'Recently viewed updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recently viewed properties
 * @route   GET /api/users/recently-viewed
 * @access  Private
 */
const getRecentlyViewed = async (req, res, next) => {
  try {
    const { Properties } = require('../models/Property');
    
    const user = await Users().findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { recentlyViewed: 1 } }
    );

    if (!user || !user.recentlyViewed || user.recentlyViewed.length === 0) {
      return ApiResponse.success(res, 'No recently viewed properties', { properties: [] });
    }

    // Keep the order of recent views
    const properties = await Properties().find({
      _id: { $in: user.recentlyViewed }
    }).toArray();

    // Map back to original order
    const orderedProperties = user.recentlyViewed.map(id => 
      properties.find(p => p._id.toString() === id.toString())
    ).filter(Boolean);

    return ApiResponse.success(res, 'Recently viewed properties fetched', { properties: orderedProperties });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getAgents,
  updateProfile,
  getUserById,
  getSavedProperties,
  addToWishlist,
  removeFromWishlist,
  addRecentlyViewed,
  getRecentlyViewed
};
