const { Projects } = require('../models/Project');
const ApiResponse = require('../utils/apiResponse');
const { generateUniqueSlug } = require('../utils/slugify');
const { ObjectId } = require('mongodb');
const { Leads } = require('../models/Lead');
const { Users } = require('../models/User');
const { Wishlists } = require('../models/Wishlist');
const { deleteImage } = require('../utils/storageCleanup');


/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private/Admin
 */
const createProject = async (req, res, next) => {
  try {
    const projectData = {
      ...req.body,
      slug: await generateUniqueSlug(req.body.title, Projects()),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: req.body.status || 'ongoing', // ongoing, completed, upcoming
    };

    // If created by agent, add agentId
    if (req.user.role === 'agent') {
      projectData.agent = new ObjectId(req.user._id);
    }

    const result = await Projects().insertOne(projectData);
    const project = { ...projectData, _id: result.insertedId };

    return ApiResponse.success(res, 'Project created successfully', { project }, 201);
  } catch (error) {
    next(error);
  }
};

const { getSortObject } = require('../utils/queryHelpers');

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Public
 */
/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Public
 */
const getProjects = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      city,
      area,
      road,
      minSize,
      maxSize,
      minPrice,
      maxPrice,
      beds,
      baths,
      minFloors,
      facing,
      handoverTime,
      amenities,
      availableOnly,
      parking,
      search,
      homeFeatured,
      sort,
      agentId // Add agentId filtering
    } = req.query;

    const query = {};

    // 0. Agent Filter
    if (agentId) {
      query.agent = new ObjectId(agentId);
    }

    // 1. Basic Filters
    if (status && status !== 'all') query.status = status;
    
    // 2. Location Filters (Regex for flexibility)
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (area) query['location.address'] = { $regex: area, $options: 'i' }; // Approximate area search in address
    if (road) query['location.address'] = { $regex: `Road.*${road}`, $options: 'i' }; // Approximate road search

    // 3. Search (Name/Description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 3.5. Home Featured Filter
    if (homeFeatured === 'true') {
      query.isHomeFeatured = true;
    }

    // 4. Numeric Range Filters
    const safeNum = (val) => {
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    if (minSize || maxSize) {
      const minS = safeNum(minSize);
      const maxS = safeNum(maxSize);
      
      const sizeConditions = [];
      
      // Condition 1: Check cached numeric field if it exists
      const numericRange = {};
      if (minS !== null) numericRange.$gte = minS;
      if (maxS !== null) numericRange.$lte = maxS;
      
      if (Object.keys(numericRange).length > 0) {
         sizeConditions.push({ flatSizeNum: numericRange });
         
         // Fallback: Check existing string fields (minFlatSize/maxFlatSize) if they hold numbers or convertible strings
         // MongoDB $gte/$lte compares numbers correctly if fields are numeric types.
         if (minS !== null) sizeConditions.push({ minFlatSize: { $gte: minS } });
         if (maxS !== null) sizeConditions.push({ maxFlatSize: { $lte: maxS } });
         
         query.$or = sizeConditions;
      }
    }

    if (minPrice || maxPrice) {
      const priceQuery = {};
      const minP = safeNum(minPrice);
      const maxP = safeNum(maxPrice);
      
      if (minP !== null) priceQuery.$gte = minP;
      if (maxP !== null) priceQuery.$lte = maxP;
      
      if (Object.keys(priceQuery).length > 0) {
        // Fallback search on 'price' field if 'pricePerSqFtNum' is missing? 
        // We'll stick to one field for now but safe check ensures no NaN queries
        query.pricePerSqFtNum = priceQuery;
      }
    }

    const bedsNum = safeNum(beds);
    const bathsNum = safeNum(baths);

    if (bedsNum !== null) query.bedroomCountNum = { $gte: bedsNum };
    if (bathsNum !== null) query.bathroomCountNum = { $gte: bathsNum };
    
    // 5. Building & Layout
    if (minFloors) {
       // Placeholder: require future data update
    }
    
    if (facing) query.facing = { $regex: facing, $options: 'i' };

    // 6. Amenities
    if (amenities) {
      const amenitiesList = Array.isArray(amenities) ? amenities : [amenities];
      const validAmenities = amenitiesList.filter(a => typeof a === 'string' && a.length > 0);
      
      if (validAmenities.length > 0) {
         query.$and = validAmenities.map(a => ({ 
            amenities: { $regex: a, $options: 'i' } 
         }));
      }
    }
    
    // 7. Availability
    if (availableOnly === 'true') {
        const unavailableRegex = /sold|out|none|reserved|booked|0/i;
        
        query.$or = [
            // Case 1: Text field exists and does NOT contain unavailable keywords
            { 
              availableFlats: { 
                $not: { $regex: unavailableRegex }, 
                $ne: null,
                $exists: true
              } 
            },
            // Case 2: Numeric field exists and is greater than 0
            { availableFlatsNum: { $gt: 0 } }
        ];
        
        // Ensure we don't return documents where BOTH are missing/invalid if that's the intent, 
        // but $or usually handles "at least one matches".
    }
    
    if (parking === 'true') {
        query.parking = { $regex: /yes|available|included/i };
    }

    const sortObj = getSortObject(sort);
    const skip = (Number(page) - 1) * Number(limit);

    const projects = await Projects()
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const total = await Projects().countDocuments(query);

    return ApiResponse.success(res, 'Projects fetched', {
      projects,
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
 * @desc    Get project by slug
 * @route   GET /api/projects/:slug
 * @access  Public
 */
const getProjectBySlug = async (req, res, next) => {
  try {
    const matchQuery = { $or: [{ slug: req.params.slug }] };
    
    if (ObjectId.isValid(req.params.slug)) {
      matchQuery.$or.push({ _id: new ObjectId(req.params.slug) });
    }

    const project = await Projects().findOne(matchQuery);

    if (!project) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    return ApiResponse.success(res, 'Project found', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get project by ID
 * @route   GET /api/projects/id/:id
 * @access  Public
 */
const getProjectById = async (req, res, next) => {
  try {
    const projectId = new ObjectId(req.params.id);
    const project = await Projects().findOne({ _id: projectId });

    if (!project) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    return ApiResponse.success(res, 'Project found', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private/Admin
 */
const updateProject = async (req, res, next) => {
  try {
    const projectId = new ObjectId(req.params.id);
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    delete updateData._id;
    delete updateData.slug;

    const result = await Projects().updateOne(
      { _id: projectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    const updatedProject = await Projects().findOne({ _id: projectId });

    return ApiResponse.success(res, 'Project updated successfully', { project: updatedProject });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private/Admin
 */
const deleteProject = async (req, res, next) => {
  try {
    const projectId = new ObjectId(req.params.id);

    // 1. Delete associated leads
    await Leads().deleteMany({ targetId: projectId, interestType: 'project' });

    // 2. Remove from user profile saved items and recently viewed
    await Users().updateMany(
      {},
      { 
        $pull: { 
          savedProperties: projectId,
          recentlyViewed: projectId
        } 
      }
    );

    // 3. Remove from specific Wishlist collections
    await Wishlists().updateMany(
      { properties: projectId },
      { $pull: { properties: projectId } }
    );

    // 4. Cleanup Images
    const project = await Projects().findOne({ _id: projectId });
    if (project && project.images && Array.isArray(project.images)) {
      project.images.forEach(img => {
        deleteImage(img).catch(err => console.error(err));
      });
    }

    const result = await Projects().deleteOne({ _id: projectId });


    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    return ApiResponse.success(res, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload project images
 * @route   POST /api/projects/:id/images
 * @access  Private/Admin
 */
const uploadProjectImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return ApiResponse.error(res, 'No images uploaded', 400);
    }

    const imageUrls = req.files.map(file => file.path);
    const projectId = new ObjectId(req.params.id);

    await Projects().updateOne(
      { _id: projectId },
      { $push: { images: { $each: imageUrls } }, $set: { updatedAt: new Date() } }
    );

    return ApiResponse.success(res, 'Project images uploaded successfully', { images: imageUrls });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectBySlug,
  getProjectById,
  updateProject,
  deleteProject,
  uploadProjectImages
};
