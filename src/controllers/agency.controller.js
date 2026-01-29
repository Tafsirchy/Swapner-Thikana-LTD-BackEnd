const { Agencies } = require('../models/Agency');
const ApiResponse = require('../utils/apiResponse');
const { generateUniqueSlug } = require('../utils/slugify');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get all agencies
 * @route   GET /api/agencies
 * @access  Public
 */
const getAgencies = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const agencies = await Agencies()
      .find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const total = await Agencies().countDocuments(query);

    return ApiResponse.success(res, 'Agencies fetched', {
      agencies,
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
 * @desc    Get agency by slug
 * @route   GET /api/agencies/:slug
 * @access  Public
 */
const getAgencyBySlug = async (req, res, next) => {
  try {
    const agency = await Agencies().findOne({ slug: req.params.slug });

    if (!agency) {
      return ApiResponse.error(res, 'Agency not found', 404);
    }

    return ApiResponse.success(res, 'Agency found', { agency });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get agency by ID
 * @route   GET /api/agencies/id/:id
 * @access  Public
 */
const getAgencyById = async (req, res, next) => {
  try {
    const agencyId = new ObjectId(req.params.id);
    const agency = await Agencies().findOne({ _id: agencyId });

    if (!agency) {
      return ApiResponse.error(res, 'Agency not found', 404);
    }

    return ApiResponse.success(res, 'Agency found', { agency });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Create agency
 * @route   POST /api/agencies
 * @access  Private/Admin
 */
const createAgency = async (req, res, next) => {
  try {
    const agencyData = {
      ...req.body,
      slug: await generateUniqueSlug(req.body.name, Agencies()),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Agencies().insertOne(agencyData);
    const agency = { ...agencyData, _id: result.insertedId };

    return ApiResponse.success(res, 'Agency created successfully', { agency }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update agency
 * @route   PUT /api/agencies/:id
 * @access  Private/Admin
 */
const updateAgency = async (req, res, next) => {
  try {
    const agencyId = new ObjectId(req.params.id);
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    delete updateData._id;
    delete updateData.slug;

    const result = await Agencies().updateOne(
      { _id: agencyId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Agency not found', 404);
    }

    const updatedAgency = await Agencies().findOne({ _id: agencyId });

    return ApiResponse.success(res, 'Agency updated successfully', { agency: updatedAgency });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete agency
 * @route   DELETE /api/agencies/:id
 * @access  Private/Admin
 */
const deleteAgency = async (req, res, next) => {
  try {
    const agencyId = new ObjectId(req.params.id);
    const result = await Agencies().deleteOne({ _id: agencyId });

    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Agency not found', 404);
    }

    return ApiResponse.success(res, 'Agency deleted successfully');
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAgencies,
  getAgencyBySlug,
  getAgencyById,
  createAgency,
  updateAgency,
  deleteAgency

};
