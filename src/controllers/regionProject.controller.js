const { RegionProjects, validateRegionProject } = require('../models/RegionProject');
const { Regions } = require('../models/Region');
const { Projects } = require('../models/Project');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get projects for a specific region
 * @route   GET /api/regions/:regionId/projects
 * @access  Public
 */
const getRegionProjects = async (req, res, next) => {
  try {
    const { regionId } = req.params;
    const { featured } = req.query;

    // Check if region exists
    const region = await Regions().findOne({ id: regionId });
    if (!region) {
      return ApiResponse.error(res, 'Region not found', 404);
    }

    // Build query
    const query = { regionId };
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Fetch linked projects with project details
    const links = await RegionProjects()
      .find(query)
      .sort({ displayOrder: 1 })
      .toArray();

    // Populate project details
    const projectIds = links.map(link => new ObjectId(link.projectId));
    const projects = await Projects()
      .find({ _id: { $in: projectIds } })
      .toArray();

    // Create project map for quick lookup
    const projectMap = {};
    projects.forEach(p => {
      projectMap[p._id.toString()] = p;
    });

    // Merge link data with project data
    const enrichedProjects = links
      .map(link => {
        const project = projectMap[link.projectId.toString()];
        if (!project) return null;
        
        return {
          _id: project._id,
          title: project.title,
          slug: project.slug,
          description: project.description,
          location: project.location?.address || project.location?.city || '',
          image: project.images?.[0] || '',
          status: project.status,
          type: project.type || 'Residential',
          price: project.pricePerSqFt || '',
          displayOrder: link.displayOrder,
          isFeatured: link.isFeatured
        };
      })
      .filter(p => p !== null);

    return ApiResponse.success(res, 'Projects fetched successfully', {
      region: {
        id: region.id,
        name: region.name,
        image: region.image,
        description: region.description
      },
      projects: enrichedProjects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all projects across all regions
 * @route   GET /api/master-plan/projects
 * @access  Public
 */
const getAllMasterPlanProjects = async (req, res, next) => {
  try {
    const { region, featured } = req.query;

    // Build query
    const query = {};
    if (region) query.regionId = region;
    if (featured === 'true') query.isFeatured = true;

    // Fetch all links
    const links = await RegionProjects()
      .find(query)
      .sort({ regionId: 1, displayOrder: 1 })
      .toArray();

    // Get unique project IDs
    const projectIds = [...new Set(links.map(link => new ObjectId(link.projectId)))];
    
    // Fetch project details
    const projects = await Projects()
      .find({ _id: { $in: projectIds } })
      .toArray();

    // Fetch region data
    const regionIds = [...new Set(links.map(link => link.regionId))];
    const regions = await Regions().find({ id: { $in: regionIds } }).toArray();

    // Create maps
    const projectMap = {};
    projects.forEach(p => {
      projectMap[p._id.toString()] = p;
    });

    const regionMap = {};
    regions.forEach(r => {
      regionMap[r.id] = r.name;
    });

    // Merge data
    const enrichedProjects = links
      .map(link => {
        const project = projectMap[link.projectId.toString()];
        if (!project) return null;

        return {
          _id: project._id,
          title: project.title,
          slug: project.slug,
          description: project.description,
          location: project.location?.address || project.location?.city || '',
          image: project.images?.[0] || '',
          regionId: link.regionId,
          regionName: regionMap[link.regionId] || link.regionId,
          isFeatured: link.isFeatured,
          status: project.status
        };
      })
      .filter(p => p !== null);

    return ApiResponse.success(res, 'Projects fetched successfully', {
      total: enrichedProjects.length,
      projects: enrichedProjects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Link a project to a region
 * @route   POST /api/admin/region-projects
 * @access  Private/Admin
 */
const linkProjectToRegion = async (req, res, next) => {
  try {
    const { projectId, regionId, isFeatured = false } = req.body;

    // Validate input
    const validation = validateRegionProject({ projectId, regionId, isFeatured });
    if (!validation.isValid) {
      return ApiResponse.error(res, validation.error, 400);
    }

    // Check if project exists
    const project = await Projects().findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    // Check if region exists
    const region = await Regions().findOne({ id: regionId });
    if (!region) {
      return ApiResponse.error(res, 'Region not found', 404);
    }

    // Check for duplicate link
    const existingLink = await RegionProjects().findOne({
      projectId: new ObjectId(projectId),
      regionId
    });

    if (existingLink) {
      return ApiResponse.error(res, 'Project is already linked to this region', 400);
    }

    // Calculate next display order
    const maxOrderDoc = await RegionProjects()
      .find({ regionId })
      .sort({ displayOrder: -1 })
      .limit(1)
      .toArray();

    const nextOrder = maxOrderDoc.length > 0 ? maxOrderDoc[0].displayOrder + 1 : 1;

    // Create link
    const linkData = {
      projectId: new ObjectId(projectId),
      regionId,
      displayOrder: nextOrder,
      isFeatured,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await RegionProjects().insertOne(linkData);

    return ApiResponse.success(res, 'Project linked to region successfully', {
      link: {
        _id: result.insertedId,
        projectId: linkData.projectId,
        regionId: linkData.regionId,
        displayOrder: linkData.displayOrder,
        isFeatured: linkData.isFeatured
      }
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all project-region links
 * @route   GET /api/admin/region-projects
 * @access  Private/Admin
 */
const getRegionProjectLinks = async (req, res, next) => {
  try {
    const { regionId, projectId } = req.query;

    // Build query
    const query = {};
    if (regionId) query.regionId = regionId;
    if (projectId) query.projectId = new ObjectId(projectId);

    // Fetch links
    const links = await RegionProjects()
      .find(query)
      .sort({ regionId: 1, displayOrder: 1 })
      .toArray();

    // Populate project details
    const projectIds = links.map(link => link.projectId);
    const projects = await Projects()
      .find({ _id: { $in: projectIds } })
      .toArray();

    const projectMap = {};
    projects.forEach(p => {
      projectMap[p._id.toString()] = {
        title: p.title,
        location: p.location?.address || p.location?.city || '',
        image: p.images?.[0] || ''
      };
    });

    // Enrich links with project data
    const enrichedLinks = links.map(link => ({
      _id: link._id,
      projectId: link.projectId,
      regionId: link.regionId,
      displayOrder: link.displayOrder,
      isFeatured: link.isFeatured,
      project: projectMap[link.projectId.toString()] || null
    }));

    return ApiResponse.success(res, 'Links fetched successfully', {
      links: enrichedLinks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project-region link
 * @route   PUT /api/admin/region-projects/:id
 * @access  Private/Admin
 */
const updateRegionProjectLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { displayOrder, isFeatured } = req.body;

    // Validate at least one field is provided
    if (displayOrder === undefined && isFeatured === undefined) {
      return ApiResponse.error(res, 'At least one field (displayOrder or isFeatured) must be provided', 400);
    }

    // Build update object
    const updateData = { updatedAt: new Date() };
    if (displayOrder !== undefined) {
      if (typeof displayOrder !== 'number' || displayOrder < 1) {
        return ApiResponse.error(res, 'displayOrder must be a positive integer', 400);
      }
      updateData.displayOrder = displayOrder;
    }
    if (isFeatured !== undefined) {
      if (typeof isFeatured !== 'boolean') {
        return ApiResponse.error(res, 'isFeatured must be a boolean', 400);
      }
      updateData.isFeatured = isFeatured;
    }

    // Update link
    const result = await RegionProjects().updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Link not found', 404);
    }

    // Fetch updated link
    const updatedLink = await RegionProjects().findOne({ _id: new ObjectId(id) });

    return ApiResponse.success(res, 'Link updated successfully', {
      link: {
        _id: updatedLink._id,
        displayOrder: updatedLink.displayOrder,
        isFeatured: updatedLink.isFeatured
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project-region link
 * @route   DELETE /api/admin/region-projects/:id
 * @access  Private/Admin
 */
const deleteRegionProjectLink = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get the link to know which region it belongs to
    const link = await RegionProjects().findOne({ _id: new ObjectId(id) });
    if (!link) {
      return ApiResponse.error(res, 'Link not found', 404);
    }

    // Delete the link
    await RegionProjects().deleteOne({ _id: new ObjectId(id) });

    // Recalculate display orders for remaining projects in this region
    const remainingLinks = await RegionProjects()
      .find({ regionId: link.regionId })
      .sort({ displayOrder: 1 })
      .toArray();

    // Update display orders (1, 2, 3, ...)
    const bulkOps = remainingLinks.map((l, index) => ({
      updateOne: {
        filter: { _id: l._id },
        update: { $set: { displayOrder: index + 1, updatedAt: new Date() } }
      }
    }));

    if (bulkOps.length > 0) {
      await RegionProjects().bulkWrite(bulkOps);
    }

    return ApiResponse.success(res, 'Project unlinked from region successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRegionProjects,
  getAllMasterPlanProjects,
  linkProjectToRegion,
  getRegionProjectLinks,
  updateRegionProjectLink,
  deleteRegionProjectLink
};
