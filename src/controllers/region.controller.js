const { Regions, validateRegion } = require('../models/Region');
const { RegionProjects } = require('../models/RegionProject');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get all regions with project counts
 * @route   GET /api/regions
 * @access  Public
 */
const getAllRegions = async (req, res, next) => {
  try {
    // Fetch all regions
    const regions = await Regions().find({}).toArray();

    // Calculate project counts for each region
    const regionsWithCounts = await Promise.all(
      regions.map(async (region) => {
        const projectCount = await RegionProjects().countDocuments({ regionId: region.id });
        return {
          id: region.id,
          name: region.name,
          image: region.image || '',
          description: region.description || '',
          projectCount
        };
      })
    );

    return ApiResponse.success(res, 'Regions fetched successfully', {
      regions: regionsWithCounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update region image and/or description
 * @route   PUT /api/admin/regions/:regionId
 * @access  Private/Admin
 */
const updateRegion = async (req, res, next) => {
  try {
    const { regionId } = req.params;
    const { image, description } = req.body;

    // Validate at least one field is provided
    if (image === undefined && description === undefined) {
      return ApiResponse.error(res, 'At least one field (image or description) must be provided', 400);
    }

    // Check if region exists
    const existingRegion = await Regions().findOne({ id: regionId });
    if (!existingRegion) {
      return ApiResponse.error(res, 'Region not found', 404);
    }

    // Build update object (only update provided fields)
    const updateData = { updatedAt: new Date() };
    if (image !== undefined) updateData.image = image;
    if (description !== undefined) {
      // Basic XSS prevention - strip HTML tags
      updateData.description = description.replace(/<[^>]*>/g, '');
    }

    // Update region
    const result = await Regions().updateOne(
      { id: regionId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Region not found', 404);
    }

    // Fetch updated region
    const updatedRegion = await Regions().findOne({ id: regionId });

    return ApiResponse.success(res, 'Region updated successfully', {
      region: {
        id: updatedRegion.id,
        name: updatedRegion.name,
        image: updatedRegion.image,
        description: updatedRegion.description
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRegions,
  updateRegion
};
