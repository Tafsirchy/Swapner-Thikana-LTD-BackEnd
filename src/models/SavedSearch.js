const { getDB } = require('../config/db');

/**
 * SavedSearch collection helper
 */
const SavedSearches = () => getDB().collection('saved-searches');

/**
 * Create indexes for saved-searches collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('saved-searches').createIndex({ user: 1 });
  await db.collection('saved-searches').createIndex({ user: 1, createdAt: -1 });
};

module.exports = {
  SavedSearches,
  createIndexes
};
