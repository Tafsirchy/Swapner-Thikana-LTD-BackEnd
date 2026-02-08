const { Agents } = require('../models/Agent');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');
const { Properties } = require('../models/Property');
const { Leads } = require('../models/Lead');


/**
 * @desc    Get all agents
 * @route   GET /api/agents
 * @access  Public
 */
const getAllAgents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const agents = await Agents()
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const total = await Agents().countDocuments(query);

    return ApiResponse.success(res, 'Agents fetched', { 
      agents,
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
    const agentId = new ObjectId(id);

    // 1. Unlink from properties (set agent to null)
    await Properties().updateMany(
      { agent: agentId },
      { $set: { agent: null, updatedAt: new Date() } }
    );

    // 2. Unlink from leads (set agent to null)
    await Leads().updateMany(
      { agent: agentId },
      { $set: { agent: null, updatedAt: new Date() } }
    );

    const result = await Agents().deleteOne({ _id: agentId });


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
