const { Agents } = require('../models/Agent');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get all agents
 * @route   GET /api/agents
 * @access  Public
 */
const getAllAgents = async (req, res, next) => {
  try {
    const agents = await Agents()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return ApiResponse.success(res, 'Agents fetched', { agents });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get agent by ID
 * @route   GET /api/agents/:id
 * @access  Private/Admin
 */
const getAgentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agent = await Agents().findOne({ _id: new ObjectId(id) });

    if (!agent) {
      return ApiResponse.error(res, 'Agent not found', 404);
    }

    return ApiResponse.success(res, 'Agent fetched', { agent });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new agent
 * @route   POST /api/agents
 * @access  Private/Admin
 */
const createAgent = async (req, res, next) => {
  try {
    const agentData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      rating: req.body.rating || 0,
      listings: req.body.listings || 0
    };

    const result = await Agents().insertOne(agentData);
    const createdAgent = await Agents().findOne({ _id: result.insertedId });

    return ApiResponse.success(res, 'Agent created', { agent: createdAgent }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update agent
 * @route   PUT /api/agents/:id
 * @access  Private/Admin
 */
const updateAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    delete updateData._id;

    const result = await Agents().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return ApiResponse.error(res, 'Agent not found', 404);
    }

    return ApiResponse.success(res, 'Agent updated', { agent: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete agent
 * @route   DELETE /api/agents/:id
 * @access  Private/Admin
 */
const deleteAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Agents().deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Agent not found', 404);
    }

    return ApiResponse.success(res, 'Agent deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent
};
