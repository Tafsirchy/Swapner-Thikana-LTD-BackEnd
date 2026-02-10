const { Properties } = require('../models/Property');
const { Projects } = require('../models/Project');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get multiple items (properties or projects) by IDs
 * @route   GET /api/public/items
 * @access  Public
 */
const getItemsByIds = async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return ApiResponse.success(res, 'No IDs provided', { items: [] });
    }

    const idArray = ids.split(',').filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    
    if (idArray.length === 0) {
      return ApiResponse.success(res, 'No valid IDs provided', { items: [] });
    }

    const [properties, projects] = await Promise.all([
      Properties().find({ _id: { $in: idArray }, status: 'published' }).toArray(),
      Projects().find({ _id: { $in: idArray }, status: 'published' }).toArray()
    ]);


    // Combine and mark types
    const items = [
      ...properties.map(p => ({ ...p, itemType: 'property' })),
      ...projects.map(p => ({ ...p, itemType: 'project' }))
    ];

    // Maintain original request order if possible (optional but nice)
    const sortedItems = ids.split(',').map(id => items.find(item => item._id.toString() === id)).filter(Boolean);

    return ApiResponse.success(res, 'Items fetched successfully', { items: sortedItems });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getItemsByIds
};
