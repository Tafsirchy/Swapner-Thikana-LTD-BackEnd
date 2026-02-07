const { getDB } = require('../config/db');

/**
 * Allowed region IDs - these are fixed and cannot be changed
 */
const ALLOWED_REGIONS = [
  'dhaka',
  'mymensingh',
  'rajshahi',
  'sylhet',
  'chittagong',
  'rangpur',
  'khulna',
  'barisal'
];

/**
 * Region collection helper
 */
const Regions = () => getDB().collection('regions');

/**
 * Create indexes for regions collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('regions').createIndex({ id: 1 }, { unique: true });
};

/**
 * Validate region data
 * @param {Object} regionData 
 * @returns {Object} validation result with isValid and error
 */
const validateRegion = (regionData) => {
  // Check if id is one of allowed regions
  if (regionData.id && !ALLOWED_REGIONS.includes(regionData.id)) {
    return {
      isValid: false,
      error: `Invalid region ID. Must be one of: ${ALLOWED_REGIONS.join(', ')}`
    };
  }

  // Validate required fields for new regions
  if (!regionData.id || !regionData.name) {
    return {
      isValid: false,
      error: 'id and name are required fields'
    };
  }

  return { isValid: true };
};

module.exports = {
  Regions,
  createIndexes,
  validateRegion,
  ALLOWED_REGIONS
};
