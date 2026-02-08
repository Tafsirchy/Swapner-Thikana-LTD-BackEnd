const { Properties } = require('../models/Property');
const ApiResponse = require('../utils/apiResponse');
const { generateUniqueSlug } = require('../utils/slugify');
const { ObjectId } = require('mongodb');
const { handleNewProperty } = require('../utils/alertService');
const { createNotificationHelper } = require('./notification.controller');
const { Wishlists } = require('../models/Wishlist');
const { Reviews } = require('../models/Review');
const { Leads } = require('../models/Lead');
const { Users } = require('../models/User');
const { deleteImage } = require('../utils/storageCleanup');


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
      // Ensure numeric consistency
      price: Number(req.body.price),
      bedrooms: req.body.bedrooms ? Number(req.body.bedrooms) : undefined,
      bathrooms: req.body.bathrooms ? Number(req.body.bathrooms) : undefined,
      area: Number(req.body.area),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: req.body.status || 'pending',
      views: 0,
      featured: req.body.featured || false
    };

    const result = await Properties().insertOne(propertyData);
    const property = { ...propertyData, _id: result.insertedId };

    // Trigger instant alerts if property is published immediately
    if (property.status === 'published') {
      handleNewProperty(property);
    }

    return ApiResponse.success(res, 'Property created successfully. Awaiting approval.', { property }, 201);
  } catch (error) {
    next(error);
  }
};

const { getSortObject, parseNumeric } = require('../utils/queryHelpers');

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
      sort,
      listingType,
      propertyType,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
      bedrooms, // Alias for minBeds
      bathrooms, // Alias for minBaths
      area, // neighborhood search
      minArea, 
      maxArea,
      size, // Alias for minArea or maxArea check
      city,
      featured,
      search,
      status = 'published',
      bounds,
      polygon,
      amenities
    } = req.query;

    const query = { status };
    const andConditions = [];

    // Bounding Box Filter (swLat,swLng,neLat,neLng)
    if (bounds) {
      const [swLat, swLng, neLat, neLng] = bounds.split(',').map(Number);
      andConditions.push({ 'coordinates.lat': { $gte: swLat, $lte: neLat } });
      andConditions.push({ 'coordinates.lng': { $gte: swLng, $lte: neLng } });
    }

    // Polygon Filter [[lat,lng],...]
    if (polygon) {
      try {
        const points = JSON.parse(polygon);
        const lats = points.map(p => p[0]);
        const lngs = points.map(p => p[1]);
        andConditions.push({ 'coordinates.lat': { $gte: Math.min(...lats), $lte: Math.max(...lats) } });
        andConditions.push({ 'coordinates.lng': { $gte: Math.min(...lngs), $lte: Math.max(...lngs) } });
      } catch (e) {
        return ApiResponse.error(res, 'Invalid polygon format', 400);
      }
    }

    // Filtering
    if (listingType) query.listingType = listingType;
    if (propertyType) query.propertyType = propertyType;
    if (featured === 'true') query.featured = true;
    if (area) query['location.area'] = { $regex: area, $options: 'i' };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    
    // Price range
    const pMin = parseNumeric(minPrice);
    const pMax = parseNumeric(maxPrice);
    if (pMin !== undefined || pMax !== undefined) {
      const priceFilter = {};
      if (pMin !== undefined) priceFilter.$gte = pMin;
      if (pMax !== undefined) priceFilter.$lte = pMax;
      query.price = priceFilter;
    }

    // Area range (sq ft) - check both path 'area' and potential 'size'
    const aMin = parseNumeric(minArea || size);
    const aMax = parseNumeric(maxArea);
    if (aMin !== undefined || aMax !== undefined) {
      const areaFilter = {};
      if (aMin !== undefined) areaFilter.$gte = aMin;
      if (aMax !== undefined) areaFilter.$lte = aMax;
      
      andConditions.push({
        $or: [
          { area: areaFilter },
          { size: areaFilter }
        ]
      });
    }

    // Capacity
    const bedsNum = parseNumeric(minBeds || bedrooms);
    const bathsNum = parseNumeric(minBaths || bathrooms);
    if (bedsNum !== undefined) query.bedrooms = { $gte: bedsNum };
    if (bathsNum !== undefined) query.bathrooms = { $gte: bathsNum };

    // Search
    if (search) {
      andConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'location.address': { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Amenities (Ensure strictly all selected are present)
    if (amenities) {
      let amenitiesList = [];
      if (Array.isArray(amenities)) {
        amenitiesList = amenities;
      } else if (typeof amenities === 'string') {
        amenitiesList = amenities.split(',').map(a => a.trim()).filter(Boolean);
      }

      if (amenitiesList.length > 0) {
        andConditions.push({ amenities: { $all: amenitiesList } });
      }
    }

    // Combine andConditions into query
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Sorting
    const sortObj = getSortObject(sort);

    console.log('[DEBUG] getProperties Query:', JSON.stringify(query, null, 2));
    console.log('[DEBUG] getProperties Sort:', JSON.stringify(sortObj, null, 2));

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
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    const sortObj = getSortObject(req.query.sort);

    const properties = await Properties()
      .find(query)
      .sort(sortObj)
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
    // AND strictly enforce published status for public view
    const matchQuery = { 
      $and: [
        { status: 'published' },
        {
          $or: [{ slug: req.params.slug }]
        }
      ]
    };
    
    if (ObjectId.isValid(req.params.slug)) {
      matchQuery.$and[1].$or.push({ _id: new ObjectId(req.params.slug) });
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
    // Strictly enforce published status for public view
    const results = await Properties().aggregate([
      { $match: { _id: propertyId, status: 'published' } },
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

    // Check ownership
    if (property.agent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.error(res, 'Not authorized to update this property', 403);
    }

    const updateData = { ...req.body, updatedAt: new Date() };
    
    // Ensure numeric consistency
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.bedrooms) updateData.bedrooms = Number(updateData.bedrooms);
    if (updateData.bathrooms) updateData.bathrooms = Number(updateData.bathrooms);
    if (updateData.area) updateData.area = Number(updateData.area);

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

      // Notify the Agent
      await createNotificationHelper(
        property.agent,
        'property_status',
        'Property Published',
        `Your property "${updatedProperty.title}" is now live and visible to buyers.`,
        `/dashboard/properties/${updatedProperty._id}`
      );
    }

    // Property Rejected Notification
    if (updateData.status === 'rejected' && property.status !== 'rejected') {
       await createNotificationHelper(
        property.agent,
        'property_status',
        'Property Rejected',
        `Your property "${updatedProperty.title}" was rejected. Please check for details.`,
        `/dashboard/properties/${updatedProperty._id}`
      );
    }

    // Check for Price Drop
    if (updateData.price && updateData.price < property.price) {
      // Find all users who have this property in their wishlist
      const wishlists = await Wishlists().find({ properties: propertyId }).toArray();
      
      console.log(`📉 Price moved from ${property.price} to ${updateData.price}. Notifying ${wishlists.length} users.`);

      for (const w of wishlists) {
        await createNotificationHelper(
          w.user,
          'price_drop',
          'Price Drop Alert! 📉',
          `Good news! The price for "${updatedProperty.title}" has dropped to BDT ${updatedProperty.price.toLocaleString()}.`,
          `/properties/${updatedProperty.slug}`
        );
      }
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

    // 1. Delete associated reviews
    await Reviews().deleteMany({ propertyId });

    // 2. Delete associated leads
    await Leads().deleteMany({ targetId: propertyId, interestType: 'property' });

    // 3. Remove from user profile saved items and recently viewed
    await Users().updateMany(
      {},
      { 
        $pull: { 
          savedProperties: propertyId,
          recentlyViewed: propertyId
        } 
      }
    );

    // 4. Remove from specific Wishlist collections
    await Wishlists().updateMany(
      { properties: propertyId },
      { $pull: { properties: propertyId } }
    );

    // 5. Cleanup Images
    if (property.images && Array.isArray(property.images)) {
      property.images.forEach(img => {
        deleteImage(img).catch(err => console.error(err));
      });
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
    const property = await Properties().findOne({ _id: propertyId });

    if (!property) {
      return ApiResponse.error(res, 'Property not found', 404);
    }

    // Check ownership
    if (property.agent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.error(res, 'Not authorized to upload images to this property', 403);
    }

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
