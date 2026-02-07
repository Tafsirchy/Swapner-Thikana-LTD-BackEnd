const { getDB } = require('../config/db');
const { ALLOWED_REGIONS } = require('./Region');

/**
 * RegionProjects collection helper
 */
const RegionProjects = () => getDB().collection('regionProjects');

/**
 * Create indexes for regionProjects collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  // Compound unique index to prevent duplicate project-region links
  await db.collection('regionProjects').createIndex(
    { projectId: 1, regionId: 1 },
    { unique: true }
  );
  
  // Index for ordered queries by region
  await db.collection('regionProjects').createIndex(
    { regionId: 1, displayOrder: 1 }
  );
  
  // Index for reverse lookups (find all regions for a project)
  await db.collection('regionProjects').createIndex({ projectId: 1 });
};

/**
 * Validate regionProject data
 * @param {Object} linkData 
 * @returns {Object} validation result with isValid and error
 */
const validateRegionProject = (linkData) => {
  // Validate required fields
  if (!linkData.projectId || !linkData.regionId) {
    return {
      isValid: false,
      error: 'projectId and regionId are required fields'
    };
  }

  // Validate regionId is one of allowed regions
  if (!ALLOWED_REGIONS.includes(linkData.regionId)) {
    return {
      isValid: false,
      error: `Invalid regionId. Must be one of: ${ALLOWED_REGIONS.join(', ')}`
    };
  }

  // Validate displayOrder if provided
  if (linkData.displayOrder !== undefined) {
    if (typeof linkData.displayOrder !== 'number' || linkData.displayOrder < 1) {
      return {
        isValid: false,
        error: 'displayOrder must be a positive integer'
      };
    }
  }

  // Validate isFeatured if provided
  if (linkData.isFeatured !== undefined && typeof linkData.isFeatured !== 'boolean') {
    return {
      isValid: false,
      error: 'isFeatured must be a boolean'
    };
  }

  return { isValid: true };
};

module.exports = {
  RegionProjects,
  createIndexes,
  validateRegionProject
};
