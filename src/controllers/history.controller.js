const { History } = require('../models/History');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get all published milestones
 * @route   GET /api/history
 * @access  Public
 */
const getPublicHistory = async (req, res, next) => {
  try {
    const milestones = await History()
      .find({ status: 'Published' })
      .sort({ year: 1, order: 1 })
      .toArray();

    return ApiResponse.success(res, 'History milestones fetched', { milestones });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all milestones (including drafts)
 * @route   GET /api/history/admin
 * @access  Private/Admin
 */
const getAllMilestones = async (req, res, next) => {
  try {
    const milestones = await History()
      .find({})
      .sort({ year: -1, order: 1 })
      .toArray();

    return ApiResponse.success(res, 'All milestones fetched', { milestones });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get milestone by ID
 * @route   GET /api/history/:id
 * @access  Private/Admin
 */
const getMilestoneById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const milestone = await History().findOne({ _id: new ObjectId(id) });

    if (!milestone) {
      return ApiResponse.error(res, 'Milestone not found', 404);
    }

    return ApiResponse.success(res, 'Milestone fetched', { milestone });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new milestone
 * @route   POST /api/history
 * @access  Private/Admin
 */
const createMilestone = async (req, res, next) => {
  try {
    const milestoneData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await History().insertOne(milestoneData);
    const createdMilestone = await History().findOne({ _id: result.insertedId });

    return ApiResponse.success(res, 'Milestone created', { milestone: createdMilestone }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update milestone
 * @route   PUT /api/history/:id
 * @access  Private/Admin
 */
const updateMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    delete updateData._id;

    const result = await History().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return ApiResponse.error(res, 'Milestone not found', 404);
    }

    return ApiResponse.success(res, 'Milestone updated', { milestone: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete milestone
 * @route   DELETE /api/history/:id
 * @access  Private/Admin
 */
const deleteMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await History().deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Milestone not found', 404);
    }

    return ApiResponse.success(res, 'Milestone deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicHistory,
  getAllMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone
};
