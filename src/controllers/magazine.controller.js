const { Magazines } = require('../models/Magazine');
const ApiResponse = require('../utils/apiResponse');
const { generateUniqueSlug } = require('../utils/slugify');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get all magazines
 * @route   GET /api/magazines
 * @access  Public
 */
const getMagazines = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = { isPublished: true };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const magazines = await Magazines()
      .find(query)
      .sort({ publicationDate: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const total = await Magazines().countDocuments(query);

    return ApiResponse.success(res, 'Magazines fetched', {
      magazines,
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
 * @desc    Get magazine by slug
 * @route   GET /api/magazines/:slug
 * @access  Public
 */
const getMagazineBySlug = async (req, res, next) => {
  try {
    const magazine = await Magazines().findOne({ slug: req.params.slug });

    if (!magazine) {
      return ApiResponse.error(res, 'Magazine not found', 404);
    }

    return ApiResponse.success(res, 'Magazine found', { magazine });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get magazine by ID
 * @route   GET /api/magazines/id/:id
 * @access  Public
 */
const getMagazineById = async (req, res, next) => {
  try {
    const magazineId = new ObjectId(req.params.id);
    const magazine = await Magazines().findOne({ _id: magazineId });

    if (!magazine) {
      return ApiResponse.error(res, 'Magazine not found', 404);
    }

    return ApiResponse.success(res, 'Magazine found', { magazine });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Create magazine
 * @route   POST /api/magazines
 * @access  Private/Admin
 */
const createMagazine = async (req, res, next) => {
  try {
    const magazineData = {
      ...req.body,
      slug: await generateUniqueSlug(req.body.title, Magazines()),
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublished: req.body.isPublished !== false // Default true
    };

    const result = await Magazines().insertOne(magazineData);
    const magazine = { ...magazineData, _id: result.insertedId };

    return ApiResponse.success(res, 'Magazine created successfully', { magazine }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update magazine
 * @route   PUT /api/magazines/:id
 * @access  Private/Admin
 */
const updateMagazine = async (req, res, next) => {
  try {
    const magazineId = new ObjectId(req.params.id);
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    delete updateData._id;
    delete updateData.slug;

    const result = await Magazines().updateOne(
      { _id: magazineId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Magazine not found', 404);
    }

    const updatedMagazine = await Magazines().findOne({ _id: magazineId });

    return ApiResponse.success(res, 'Magazine updated successfully', { magazine: updatedMagazine });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete magazine
 * @route   DELETE /api/magazines/:id
 * @access  Private/Admin
 */
const deleteMagazine = async (req, res, next) => {
  try {
    const magazineId = new ObjectId(req.params.id);
    const result = await Magazines().deleteOne({ _id: magazineId });

    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Magazine not found', 404);
    }

    return ApiResponse.success(res, 'Magazine deleted successfully');
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getMagazines,
  getMagazineBySlug,
  getMagazineById,
  createMagazine,
  updateMagazine,
  deleteMagazine

};
