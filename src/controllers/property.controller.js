const { Properties } = require('../models/Property');
const ApiResponse = require('../utils/apiResponse');
const { generateUniqueSlug } = require('../utils/slugify');
const { ObjectId } = require('mongodb');
const { handleNewProperty } = require('../utils/alertService');

/**
 * @desc    Create a new property
 * @route   POST /api/properties
 * @access  Private/Agent/Admin
 */
const createProperty = async (req, res, next) => {
  try {
    const propertyData = {
      ...req.body,
      agent: new ObjectId(req.user._id),
      slug: await generateUniqueSlug(req.body.title, Properties()),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: req.body.status || 'pending',
      views: 0,
      featured: req.body.featured || false
    };

    const result = await Properties().insertOne(propertyData);
    const property = { ...propertyData, _id: result.insertedId };

    return ApiResponse.success(res, 'Property created successfully. Awaiting approval.', { property }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all properties (with filtering, pagination, sorting)
 * @route   GET /api/properties
 * @access  Public
 */
const getProperties = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = '-createdAt',
      listingType,
      propertyType,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
      area,
      city,
      featured,
      search,
      status = 'published',
      bounds,
      polygon
    } = req.query;

    const query = { status };

    // Bounding Box Filter (swLat,swLng,neLat,neLng)
    if (bounds) {
      const [swLat, swLng, neLat, neLng] = bounds.split(',').map(Number);
      query['coordinates.lat'] = { $gte: swLat, $lte: neLat };
      query['coordinates.lng'] = { $gte: swLng, $lte: neLng };
    }

    // Polygon Filter [[lat,lng],...]
    if (polygon) {
      try {
        const points = JSON.parse(polygon);
        // Map search using point-in-polygon logic
        // Since we are using numeric lat/lng, we can use a custom aggregation or $geoWithin if we converted to GeoJSON
        // For now, we'll use regular field filtering and handle polygon logic
        // Actually, MongoDB's $geoWithin $polygon works with [lng, lat] pairs
        // If we don't have a 2d index, we might need a workaround or just recommend the user to use bounds for now
        // I'll implement a simple bounding box fallback for polygon if not fully supported without schema change
        const lats = points.map(p => p[0]);
        const lngs = points.map(p => p[1]);
        query['coordinates.lat'] = { $gte: Math.min(...lats), $lte: Math.max(...lats) };
        query['coordinates.lng'] = { $gte: Math.min(...lngs), $lte: Math.max(...lngs) };
      } catch (e) {
        console.error('Invalid polygon format');
      }
    }

    // Filtering
    if (listingType) query.listingType = listingType;
    if (propertyType) query.propertyType = propertyType;
    if (featured === 'true') query.featured = true;
    if (area) query['location.area'] = { $regex: area, $options: 'i' };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    
    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Capacity
    if (minBeds) query.bedrooms = { $gte: Number(minBeds) };
    if (minBaths) query.bathrooms = { $gte: Number(minBaths) };

    // Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    let sortObj = {};
    if (sort) {
      const field = sort.startsWith('-') ? sort.substring(1) : sort;
      const order = sort.startsWith('-') ? -1 : 1;
      sortObj[field] = order;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const properties = await Properties()
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const total = await Properties().countDocuments(query);

    return ApiResponse.success(res, 'Properties fetched', {
      properties,
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
 * @desc    Get my properties (Agent)
 * @route   GET /api/properties/my-listings
 * @access  Private/Agent
 */
const getMyProperties = async (req, res, next) => {
  try {
    const query = { agent: new ObjectId(req.user._id) };
    
    // Optional status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    const properties = await Properties()
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return ApiResponse.success(res, 'My listings fetched', { properties });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get property by slug
 * @route   GET /api/properties/:slug
 * @access  Public
 */
const getPropertyBySlug = async (req, res, next) => {
  try {
    // Build match query: match by slug OR by ID (if slug is a valid ObjectId)
    const matchQuery = { $or: [{ slug: req.params.slug }] };
    
    if (ObjectId.isValid(req.params.slug)) {
      matchQuery.$or.push({ _id: new ObjectId(req.params.slug) });
    }

    console.log(`Fetching property for: ${req.params.slug}`, matchQuery);

    // Use aggregation to find property and populate agent
    const results = await Properties().aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'agent',
          foreignField: '_id',
          as: 'agentDetails'
        }
      },
      {
        $addFields: {
          agent: { $arrayElemAt: ['$agentDetails', 0] }
        }
      },
      {
        $project: {
          agentDetails: 0,
          'agent.password': 0
        }
      }
    ]).toArray();

    const property = results[0];

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    // Increment views (async, don't wait for it)
    Properties().updateOne(
      { _id: property._id },
      { $inc: { views: 1 } }
    ).catch(err => console.error('Error incrementing views:', err));

    return ApiResponse.success(res, 'Property found', { property });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get property by ID
 * @route   GET /api/properties/id/:id
 * @access  Public
 */
const getPropertyById = async (req, res, next) => {
  try {
    const propertyId = new ObjectId(req.params.id);
    
    // Use aggregation to find property and populate agent
    const results = await Properties().aggregate([
      { $match: { _id: propertyId } },
      {
        $lookup: {
          from: 'users',
          localField: 'agent',
          foreignField: '_id',
          as: 'agentDetails'
        }
      },
      {
        $addFields: {
          agent: { $arrayElemAt: ['$agentDetails', 0] }
        }
      },
      {
        $project: {
          agentDetails: 0,
          'agent.password': 0
        }
      }
    ]).toArray();

    const property = results[0];

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    return ApiResponse.success(res, 'Property found', { property });
  } catch (error) {
    next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const propertyId = new ObjectId(req.params.id);
    const property = await Properties().findOne({ _id: propertyId });

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    const updateData = { ...req.body, updatedAt: new Date() };
    const wasPublished = property.status === 'published';
    const isNowPublished = updateData.status === 'published';

    await Properties().updateOne(
      { _id: propertyId },
      { $set: updateData }
    );

    const updatedProperty = await Properties().findOne({ _id: propertyId });

    // Trigger instant alerts if property just got published
    if (!wasPublished && isNowPublished) {
      handleNewProperty(updatedProperty);
    }

    return ApiResponse.success(res, 'Property updated successfully', { property: updatedProperty });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete property
 * @route   DELETE /api/properties/:id
 * @access  Private/Agent/Admin
 */
const deleteProperty = async (req, res, next) => {
  try {
    const propertyId = new ObjectId(req.params.id);
    const property = await Properties().findOne({ _id: propertyId });

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    // Check ownership
    if (property.agent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.error(res, 'Not authorized to delete this property', 403);
    }

    await Properties().deleteOne({ _id: propertyId });

    return ApiResponse.success(res, 'Property deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload property images
 * @route   POST /api/properties/:id/images
 * @access  Private/Agent/Admin
 */
const uploadPropertyImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return ApiResponse.error(res, 'No images uploaded', 400);
    }

    const imageUrls = req.files.map(file => file.path);
    const propertyId = new ObjectId(req.params.id);

    await Properties().updateOne(
      { _id: propertyId },
      { $push: { images: { $each: imageUrls } }, $set: { updatedAt: new Date() } }
    );

    return ApiResponse.success(res, 'Images uploaded successfully', { images: imageUrls });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyBySlug,
  getPropertyById,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  getMyProperties
};
