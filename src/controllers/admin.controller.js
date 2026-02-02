const { Users } = require('../models/User');
const { Properties } = require('../models/Property');
const { Management } = require('../models/Management');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');
const { handleNewProperty } = require('../utils/alertService');

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const usersCollection = Users();
    const propertiesCollection = Properties();

    // Get counts
    const totalUsers = await usersCollection.countDocuments();
    const totalAgents = await usersCollection.countDocuments({ role: 'agent' });
    const totalCustomers = await usersCollection.countDocuments({ role: 'customer' });
    const activeListings = await propertiesCollection.countDocuments({ status: 'published' });
    const pendingApprovals = await propertiesCollection.countDocuments({ status: 'pending' });
    const totalProperties = await propertiesCollection.countDocuments();

    return ApiResponse.success(res, 'Dashboard stats fetched', {
      stats: {
        totalUsers,
        totalAgents,
        totalCustomers,
        activeListings,
        pendingApprovals,
        totalProperties,
        managementUsers: await usersCollection.countDocuments({ role: 'management' }),
        leadershipProfiles: await Management().countDocuments()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with filters
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    const query = { isActive: { $ne: false } }; // Default exclude soft-deleted users

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await Users()
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const total = await Users().countDocuments(query);

    const mappedUsers = users.map(u => ({
      ...u,
      status: u.status || 'active'
    }));

    return ApiResponse.success(res, 'Users fetched successfully', { 
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
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'agent', 'admin', 'management'].includes(role)) {
      return ApiResponse.error(res, 'Invalid role', 400);
    }

    // Don't allow changing own role or any admin role
    const targetUser = await Users().findOne({ _id: new ObjectId(id) });
    if (!targetUser) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    if (id === req.user._id.toString()) {
      return ApiResponse.error(res, 'Cannot change your own role', 400);
    }

    if (targetUser.role === 'admin') {
      return ApiResponse.error(res, 'Administrator roles are protected and cannot be changed', 403);
    }

    const result = await Users().updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    return ApiResponse.success(res, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user status (active/inactive)
 * @route   PUT /api/admin/users/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Expecting 'active', 'inactive', or 'suspended'

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return ApiResponse.error(res, 'Invalid status value', 400);
    }

    // Don't allow changing own status or any admin status
    const targetUser = await Users().findOne({ _id: new ObjectId(id) });
    if (!targetUser) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    if (id === req.user._id.toString()) {
      return ApiResponse.error(res, 'Cannot change your own status', 400);
    }

    if (targetUser.role === 'admin') {
      return ApiResponse.error(res, 'Administrator accounts are protected and status cannot be changed', 403);
    }

    const isActive = status === 'active';

    const result = await Users().updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status, 
          isActive, // Keep for backward compatibility in middleware
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    return ApiResponse.success(res, `User status updated to ${status} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user (soft delete - deactivate)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Don't allow deleting own account
    if (id === req.user._id.toString()) {
      return ApiResponse.error(res, 'Cannot delete your own account', 400);
    }

    const result = await Users().updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, status: 'inactive', updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    return ApiResponse.success(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all properties with filters (for admin)
 * @route   GET /api/admin/properties
 * @access  Private/Admin
 */
const { getSortObject } = require('../utils/queryHelpers');

/**
 * @desc    Get all properties (for admin, with agent details)
 * @route   GET /api/admin/properties
 * @access  Private/Admin
 */
const getAllProperties = async (req, res, next) => {
  try {
    const { status, search, featured, sort } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (featured && featured !== 'all') query.featured = featured === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.area': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    const sortObj = getSortObject(sort);

    console.log('[DEBUG] admin.getAllProperties Query:', JSON.stringify(query, null, 2));
    console.log('[DEBUG] admin.getAllProperties Sort:', JSON.stringify(sortObj, null, 2));

    const properties = await Properties()
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'agent',
            foreignField: '_id',
            as: 'agentDetails'
          }
        },
        {
          $project: {
            title: 1,
            price: 1,
            status: 1,
            featured: 1,
            location: 1,
            createdAt: 1,
            views: 1,
            'agent.name': { $arrayElemAt: ['$agentDetails.name', 0] },
            'agent.email': { $arrayElemAt: ['$agentDetails.email', 0] }
          }
        },
        { $sort: sortObj }
      ])
      .toArray();

    return ApiResponse.success(res, 'Properties fetched successfully', { properties });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve property (change status to published)
 * @route   PUT /api/admin/properties/:id/approve
 * @access  Private/Admin
 */
const approveProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await Properties().updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'published', updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    // Trigger instant alerts for the newly approved property
    const property = await Properties().findOne({ _id: new ObjectId(id) });
    if (property) {
      handleNewProperty(property);
    }

    return ApiResponse.success(res, 'Property approved and published');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject property
 * @route   PUT /api/admin/properties/:id/reject
 * @access  Private/Admin
 */
const rejectProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await Properties().updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'rejected', 
          rejectionReason: reason || 'Not specified',
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    return ApiResponse.success(res, 'Property rejected');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle property featured status
 * @route   PUT /api/admin/properties/:id/feature
 * @access  Private/Admin
 */
const toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    if (typeof featured !== 'boolean') {
      return ApiResponse.error(res, 'featured must be a boolean', 400);
    }

    const result = await Properties().updateOne(
      { _id: new ObjectId(id) },
      { $set: { featured, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    return ApiResponse.success(res, `Property ${featured ? 'featured' : 'unfeatured'} successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getAllProperties,
  approveProperty,
  rejectProperty,
  toggleFeatured
};
