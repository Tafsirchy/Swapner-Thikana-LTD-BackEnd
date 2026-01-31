const { Wishlists } = require('../models/Wishlist');
const { Properties } = require('../models/Property');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get all wishlist collections for a user
 * @route   GET /api/wishlists
 * @access  Private
 */
const getWishlists = async (req, res, next) => {
  try {
    const wishlists = await Wishlists()
      .find({ user: new ObjectId(req.user._id) })
      .sort({ createdAt: -1 })
      .toArray();

    return ApiResponse.success(res, 'Wishlists fetched', { wishlists });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new wishlist collection
 * @route   POST /api/wishlists
 * @access  Private
 */
const createWishlist = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return ApiResponse.error(res, 'Wishlist name is required', 400);
    }

    const wishlist = {
      user: new ObjectId(req.user._id),
      name,
      description: description || '',
      properties: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Wishlists().insertOne(wishlist);
    wishlist._id = result.insertedId;

    return ApiResponse.success(res, 'Wishlist created successfully', { wishlist }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a wishlist collection (name/description)
 * @route   PATCH /api/wishlists/:id
 * @access  Private
 */
const updateWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updateData = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const result = await Wishlists().findOneAndUpdate(
      { _id: new ObjectId(id), user: new ObjectId(req.user._id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return ApiResponse.error(res, 'Wishlist not found', 404);
    }

    return ApiResponse.success(res, 'Wishlist updated', { wishlist: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a wishlist collection
 * @route   DELETE /api/wishlists/:id
 * @access  Private
 */
const deleteWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await Wishlists().deleteOne({
      _id: new ObjectId(id),
      user: new ObjectId(req.user._id)
    });

    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Wishlist not found', 404);
    }

    return ApiResponse.success(res, 'Wishlist deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add property to a specific wishlist
 * @route   POST /api/wishlists/:id/properties/:propertyId
 * @access  Private
 */
const addPropertyToWishlist = async (req, res, next) => {
  try {
    const { id, propertyId } = req.params;
    const { Projects } = require('../models/Project');

    // Check if property or project exists
    let item = await Properties().findOne({ _id: new ObjectId(propertyId) });
    if (!item) {
      item = await Projects().findOne({ _id: new ObjectId(propertyId) });
    }

    if (!item) {
      return ApiResponse.error(res, 'Item not found', 404);
    }

    const result = await Wishlists().updateOne(
      { _id: new ObjectId(id), user: new ObjectId(req.user._id) },
      { 
        $addToSet: { properties: new ObjectId(propertyId) },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Wishlist not found', 404);
    }

    return ApiResponse.success(res, 'Item added to wishlist');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove property from a specific wishlist
 * @route   DELETE /api/wishlists/:id/properties/:propertyId
 * @access  Private
 */
const removePropertyFromWishlist = async (req, res, next) => {
  try {
    const { id, propertyId } = req.params;

    const result = await Wishlists().updateOne(
      { _id: new ObjectId(id), user: new ObjectId(req.user._id) },
      { 
        $pull: { properties: new ObjectId(propertyId) },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Wishlist not found', 404);
    }

    return ApiResponse.success(res, 'Property removed from wishlist');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get properties of a specific wishlist
 * @route   GET /api/wishlists/:id/properties
 * @access  Private
 */
const getWishlistProperties = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Projects } = require('../models/Project');

    const wishlist = await Wishlists().findOne({
      _id: new ObjectId(id),
      user: new ObjectId(req.user._id)
    });

    if (!wishlist) {
      return ApiResponse.error(res, 'Wishlist not found', 404);
    }

    const [properties, projects] = await Promise.all([
      Properties().find({ _id: { $in: wishlist.properties || [] } }).toArray(),
      Projects().find({ _id: { $in: wishlist.properties || [] } }).toArray()
    ]);

    const items = [
      ...properties.map(p => ({ ...p, itemType: 'property' })),
      ...projects.map(p => ({ ...p, itemType: 'project' }))
    ];

    return ApiResponse.success(res, 'Wishlist items fetched', { properties: items, wishlist });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlists,
  createWishlist,
  updateWishlist,
  deleteWishlist,
  addPropertyToWishlist,
  removePropertyFromWishlist,
  getWishlistProperties
};
