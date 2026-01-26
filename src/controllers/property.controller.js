const Property = require('../models/Property');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all properties with filters and pagination
 * @route   GET /api/properties
 * @access  Public
 */
const getProperties = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      propertyType,
      listingType,
      status,
      city,
      area,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      featured,
      search,
      sortBy = '-createdAt',
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (propertyType) filter.propertyType = propertyType;
    if (listingType) filter.listingType = listingType;
    if (status) filter.status = status;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (area) filter['location.area'] = new RegExp(area, 'i');
    if (bedrooms) filter['specs.bedrooms'] = { $gte: parseInt(bedrooms) };
    if (bathrooms) filter['specs.bathrooms'] = { $gte: parseInt(bathrooms) };
    if (featured !== undefined) filter.featured = featured === 'true';

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Search filter (title, description, area, city)
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'location.area': new RegExp(search, 'i') },
        { 'location.city': new RegExp(search, 'i') },
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const properties = await Property.find(filter)
      .populate('agent', 'name email phone agentProfile')
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalProperties = await Property.countDocuments(filter);
    const totalPages = Math.ceil(totalProperties / limitNum);

    return ApiResponse.paginated(
      res,
      'Properties retrieved successfully',
      properties,
      {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalItems: totalProperties,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single property by slug
 * @route   GET /api/properties/:slug
 * @access  Public
 */
const getPropertyBySlug = async (req, res, next) => {
  try {
    const property = await Property.findOne({ slug: req.params.slug, isActive: true })
      .populate('agent', 'name email phone avatar agentProfile')
      .populate('project', 'name slug tagline');

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    // Increment views
    property.views += 1;
    await property.save();

    return ApiResponse.success(res, 'Property retrieved successfully', {
      property,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new property
 * @route   POST /api/properties
 * @access  Private (Agent, Admin)
 */
const createProperty = async (req, res, next) => {
  try {
    const {
      title,
      description,
      propertyType,
      listingType,
      price,
      location,
      specs,
      amenities,
      images,
      featured,
    } = req.body;

    // Set agent to current user
    const propertyData = {
      title,
      description,
      propertyType,
      listingType,
      price,
      location,
      specs,
      amenities: amenities || [],
      images: images || [],
      agent: req.user._id,
      featured: featured || false,
    };

    // Auto-approve if admin
    if (req.user.role === 'admin') {
      propertyData.isApproved = true;
      propertyData.publishedAt = new Date();
    }

    const property = await Property.create(propertyData);

    return ApiResponse.success(res, 'Property created successfully', {
      property,
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update property
 * @route   PUT /api/properties/:id
 * @access  Private (Agent - own properties, Admin - all)
 */
const updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    // Check ownership (agents can only update their own properties)
    if (req.user.role === 'agent' && property.agent.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to update this property', 403);
    }

    // Update property
    property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    return ApiResponse.success(res, 'Property updated successfully', {
      property,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete property
 * @route   DELETE /api/properties/:id
 * @access  Private (Agent - own properties, Admin - all)
 */
const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    // Check ownership
    if (req.user.role === 'agent' && property.agent.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to delete this property', 403);
    }

    // Soft delete (set isActive to false)
    property.isActive = false;
    await property.save();

    return ApiResponse.success(res, 'Property deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get my properties (for logged-in agent)
 * @route   GET /api/properties/my-properties
 * @access  Private (Agent, Admin)
 */
const getMyProperties = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, status } = req.query;

    const filter = { agent: req.user._id };
    if (status) filter.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const properties = await Property.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const totalProperties = await Property.countDocuments(filter);
    const totalPages = Math.ceil(totalProperties / limitNum);

    return ApiResponse.paginated(
      res,
      'Your properties retrieved successfully',
      properties,
      {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalItems: totalProperties,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get featured properties
 * @route   GET /api/properties/featured
 * @access  Public
 */
const getFeaturedProperties = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const properties = await Property.find({
      featured: true,
      isActive: true,
      isApproved: true,
    })
      .populate('agent', 'name email phone')
      .sort('-createdAt')
      .limit(limit);

    return ApiResponse.success(res, 'Featured properties retrieved', {
      properties,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get similar properties
 * @route   GET /api/properties/:id/similar
 * @access  Public
 */
const getSimilarProperties = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    const limit = parseInt(req.query.limit) || 4;

    // Find similar properties based on type and city
    const similar = await Property.find({
      _id: { $ne: property._id },
      propertyType: property.propertyType,
      'location.city': property.location.city,
      isActive: true,
      isApproved: true,
    })
      .populate('agent', 'name email')
      .limit(limit);

    return ApiResponse.success(res, 'Similar properties retrieved', {
      properties: similar,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProperties,
  getPropertyBySlug,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getFeaturedProperties,
  getSimilarProperties,
};
