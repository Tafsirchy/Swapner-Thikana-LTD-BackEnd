const { Projects } = require('../models/Project');
const ApiResponse = require('../utils/apiResponse');
const { generateUniqueSlug } = require('../utils/slugify');
const { ObjectId } = require('mongodb');

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

    const result = await Projects().insertOne(projectData);
    const project = { ...projectData, _id: result.insertedId };

    return ApiResponse.success(res, 'Project created successfully', { project }, 201);
  } catch (error) {
    next(error);
  }
};

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
      search 
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const projects = await Projects()
      .find(query)
      .sort({ createdAt: -1 })
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
    const project = await Projects().findOne({ slug: req.params.slug });

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
