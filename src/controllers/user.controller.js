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
    const { 
      page = 1, 
      limit = 10, 
      search,
      role,
      status 
    } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // For specific role queries (like management), exclude sensitive data but keep bio/designation
    // Ensure status is handled correctly
    const projection = { 
      password: 0, 
      savedProperties: 0, 
      recentlyViewed: 0, 
      fcmTokens: 0,
      notifications: 0 
    };
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const users = await Users()
        .find(query, { projection })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray();
        
    // Map isActive to status for legacy support if needed, 
    // but better to rely on new status field
    const mappedUsers = users.map(u => ({
      ...u,
      status: u.status || (u.isActive === false ? 'inactive' : 'active')
    }));

    const total = await Users().countDocuments(query);
    
    return ApiResponse.success(res, 'Users fetched', { 
        users: mappedUsers,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
        }
    });
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
    const { name, phone, bio, specialization, experience } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    
    // Handle file upload
    if (req.file) {
      // 1. Fetch current user to get old image
      const currentUser = await Users().findOne({ _id: new ObjectId(req.user._id) });
      
      // 2. Delete old image if it exists
      if (currentUser && currentUser.image) {
         // Handle both string URL and object structure
         // Note: Users collection might have mixed legacy string URLs and new Objects
         const { deleteImage } = require('../utils/storageCleanup');
         await deleteImage(currentUser.image);
         if (currentUser.avatar && currentUser.avatar !== currentUser.image) {
            await deleteImage(currentUser.avatar);
         }
      }

      updateData.image = req.file.path; // Save ImgBB Object (or URL)
      updateData.avatar = req.file.path; // Keep synced
    }

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
      { 
        projection: { 
          password: 0, 
          savedProperties: 0, 
          recentlyViewed: 0, 
          fcmTokens: 0,
          notifications: 0
        } 
      }
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
    const { Projects } = require('../models/Project');
    
    const user = await Users().findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { savedProperties: 1 } }
    );

    if (!user || !user.savedProperties || user.savedProperties.length === 0) {
      return ApiResponse.success(res, 'No saved items', { properties: [] });
    }

    const savedIds = user.savedProperties.map(id => new ObjectId(id));
    
    const [properties, projects] = await Promise.all([
      Properties().find({ _id: { $in: savedIds } }).toArray(),
      Projects().find({ _id: { $in: savedIds } }).toArray()
    ]);

    // Combine and mark type for frontend if needed, though they have different structures
    const items = [
      ...properties.map(p => ({ ...p, itemType: 'property' })),
      ...projects.map(p => ({ ...p, itemType: 'project' }))
    ];

    return ApiResponse.success(res, 'Saved items fetched', { properties: items });
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
    const { Projects } = require('../models/Project');

    // Check if property or project exists
    let item = await Properties().findOne({ _id: new ObjectId(propertyId) });
    if (!item) {
      item = await Projects().findOne({ _id: new ObjectId(propertyId) });
    }

    if (!item) {
      return ApiResponse.error(res, 'Item not found', 404);
    }

    // Check if already saved
    const user = await Users().findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { savedProperties: 1 } }
    );

    if (user.savedProperties && user.savedProperties.some(id => id.toString() === propertyId)) {
      return ApiResponse.error(res, 'Item already in wishlist', 400);
    }

    // Add to savedProperties array
    await Users().updateOne(
      { _id: new ObjectId(req.user._id) },
      { $addToSet: { savedProperties: new ObjectId(propertyId) } }
    );

    return ApiResponse.success(res, 'Item added to wishlist', { propertyId });
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
    const { Projects } = require('../models/Project');
    
    const user = await Users().findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { recentlyViewed: 1 } }
    );

    if (!user || !user.recentlyViewed || user.recentlyViewed.length === 0) {
      return ApiResponse.success(res, 'No recently viewed items', { properties: [] });
    }

    // Keep the order of recent views
    const [properties, projects] = await Promise.all([
      Properties().find({ _id: { $in: user.recentlyViewed } }).toArray(),
      Projects().find({ _id: { $in: user.recentlyViewed } }).toArray()
    ]);

    const allItems = [...properties, ...projects];

    // Map back to original order
    const orderedItems = user.recentlyViewed.map(id => 
      allItems.find(p => p._id.toString() === id.toString())
    ).filter(Boolean);

    return ApiResponse.success(res, 'Recently viewed items fetched', { properties: orderedItems });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete profile image
 * @route   DELETE /api/users/profile/image
 * @access  Private
 */
const deleteProfileImage = async (req, res, next) => {
  try {
    const { deleteImage } = require('../utils/storageCleanup');
    
    // 1. Fetch user to get image
    const currentUser = await Users().findOne({ _id: new ObjectId(req.user._id) });

    if (currentUser) {
       if (currentUser.image) await deleteImage(currentUser.image);
       if (currentUser.avatar && currentUser.avatar !== currentUser.image) await deleteImage(currentUser.avatar);
    }

    await Users().updateOne(
      { _id: new ObjectId(req.user._id) },
      { 
        $unset: { image: "", avatar: "" },
        $set: { updatedAt: new Date() }
      }
    );

    const updatedUser = await Users().findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { password: 0 } }
    );

    return ApiResponse.success(res, 'Profile image deleted', { user: updatedUser });
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
  getRecentlyViewed,
  deleteProfileImage
};
