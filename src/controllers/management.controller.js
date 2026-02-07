const { Management } = require('../models/Management');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get all management members
 * @route   GET /api/management
 * @access  Public
 */
const getAllManagement = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const members = await Management()
      .find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const total = await Management().countDocuments(query);

    return ApiResponse.success(res, 'Management members fetched', { 
      members,
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
 * @desc    Get management member by ID
 * @route   GET /api/management/:id
 * @access  Private/Admin
 */
const getManagementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await Management().findOne({ _id: new ObjectId(id) });

    if (!member) {
      return ApiResponse.error(res, 'Management member not found', 404);
    }

    return ApiResponse.success(res, 'Management member fetched', { member });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new management member
 * @route   POST /api/management
 * @access  Private/Admin
 */
const createManagement = async (req, res, next) => {
  try {
    const memberData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Management().insertOne(memberData);
    const createdMember = await Management().findOne({ _id: result.insertedId });

    return ApiResponse.success(res, 'Management member created', { member: createdMember }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update management member
 * @route   PUT /api/management/:id
 * @access  Private/Admin
 */
const updateManagement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    delete updateData._id;

    const result = await Management().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return ApiResponse.error(res, 'Management member not found', 404);
    }

    return ApiResponse.success(res, 'Management member updated', { member: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete management member
 * @route   DELETE /api/management/:id
 * @access  Private/Admin
 */
const deleteManagement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Management().deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Management member not found', 404);
    }

    return ApiResponse.success(res, 'Management member deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllManagement,
  getManagementById,
  createManagement,
  updateManagement,
  deleteManagement
};
