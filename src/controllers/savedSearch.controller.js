const { SavedSearches } = require("../models/SavedSearch");
const { Properties } = require("../models/Property");
const ApiResponse = require("../utils/apiResponse");
const { ObjectId } = require("mongodb");

/**
 * @desc    Create a saved search
 * @route   POST /api/saved-searches
 * @access  Private
 */
const createSavedSearch = async (req, res, next) => {
  try {
    const { name, filters, alertFrequency } = req.body;

    if (!name || !filters) {
      return ApiResponse.error(res, "Name and filters are required", 400);
    }

    // ✅ CRITICAL FIX: Validate filters to prevent injection attacks
    if (filters && typeof filters === "object") {
      const filterStr = JSON.stringify(filters);
      if (filterStr.includes("$") || filterStr.includes("function")) {
        return ApiResponse.error(
          res,
          "Invalid filters format: MongoDB operators not allowed",
          400,
        );
      }
    }

    const savedSearch = {
      user: req.user._id,
      name,
      filters,
      alertFrequency: alertFrequency || "never",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await SavedSearches().insertOne(savedSearch);
    savedSearch._id = result.insertedId;

    return ApiResponse.success(
      res,
      "Search saved successfully",
      { savedSearch },
      201,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's saved searches
 * @route   GET /api/saved-searches
 * @access  Private
 */
const getSavedSearches = async (req, res, next) => {
  try {
    const savedSearches = await SavedSearches()
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();

    return ApiResponse.success(res, "Saved searches retrieved", {
      savedSearches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a specific saved search
 * @route   GET /api/saved-searches/:id
 * @access  Private
 */
const getSavedSearchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const savedSearch = await SavedSearches().findOne({
      _id: new ObjectId(id),
      user: req.user._id,
    });

    if (!savedSearch) {
      return ApiResponse.error(res, "Saved search not found", 404);
    }

    return ApiResponse.success(res, "Saved search retrieved", { savedSearch });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a saved search
 * @route   PUT /api/saved-searches/:id
 * @access  Private
 */
const updateSavedSearch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, filters, alertFrequency, isActive } = req.body;

    const update = {
      $set: { updatedAt: new Date() },
    };

    if (name) update.$set.name = name;
    if (filters) update.$set.filters = filters;
    if (alertFrequency) update.$set.alertFrequency = alertFrequency;
    if (typeof isActive !== "undefined") update.$set.isActive = isActive;

    const savedSearch = await SavedSearches().findOneAndUpdate(
      { _id: new ObjectId(id), user: req.user._id },
      update,
      { returnDocument: "after" },
    );

    if (!savedSearch) {
      return ApiResponse.error(res, "Saved search not found", 404);
    }

    return ApiResponse.success(res, "Saved search updated", { savedSearch });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a saved search
 * @route   DELETE /api/saved-searches/:id
 * @access  Private
 */
const deleteSavedSearch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await SavedSearches().deleteOne({
      _id: new ObjectId(id),
      user: req.user._id,
    });

    if (result.deletedCount === 0) {
      return ApiResponse.error(res, "Saved search not found", 404);
    }

    return ApiResponse.success(res, "Saved search deleted");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get matching properties for a saved search
 * @route   GET /api/saved-searches/:id/matches
 * @access  Private
 */
const getSearchMatches = async (req, res, next) => {
  try {
    const { id } = req.params;

    const savedSearch = await SavedSearches().findOne({
      _id: new ObjectId(id),
      user: req.user._id,
    });

    if (!savedSearch) {
      return ApiResponse.error(res, "Saved search not found", 404);
    }

    // Build query from saved filters
    const query = {};
    const filters = savedSearch.filters;

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { "location.area": { $regex: filters.search, $options: "i" } },
      ];
    }
    if (filters.listingType) query.listingType = filters.listingType;
    if (filters.propertyType) query.propertyType = filters.propertyType;
    if (filters.city) query["location.city"] = filters.city;
    if (filters.bedrooms) query.bedrooms = { $gte: Number(filters.bedrooms) };
    if (filters.bathrooms)
      query.bathrooms = { $gte: Number(filters.bathrooms) };
    if (filters.minPrice)
      query.price = { ...query.price, $gte: Number(filters.minPrice) };
    if (filters.maxPrice)
      query.price = { ...query.price, $lte: Number(filters.maxPrice) };
    if (filters.minArea)
      query.area = { ...query.area, $gte: Number(filters.minArea) };
    if (filters.maxArea)
      query.area = { ...query.area, $lte: Number(filters.maxArea) };
    if (filters.amenities && filters.amenities.length > 0) {
      query.amenities = { $all: filters.amenities };
    }

    // Only show published properties
    query.status = "published";

    const properties = await Properties()
      .find(query)
      .limit(50)
      .sort({ createdAt: -1 })
      .toArray();

    return ApiResponse.success(res, "Matching properties retrieved", {
      count: properties.length,
      properties,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSavedSearch,
  getSavedSearches,
  getSavedSearchById,
  updateSavedSearch,
  deleteSavedSearch,
  getSearchMatches,
};
