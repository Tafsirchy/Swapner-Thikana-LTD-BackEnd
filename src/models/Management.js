const { getDB } = require('../config/db');

/**
 * Management collection helper
 */
const Management = () => getDB().collection('management');

/**
 * Create indexes for management collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('management').createIndex({ email: 1 }, { unique: true });
  await db.collection('management').createIndex({ order: 1 });
};

module.exports = {
  Management,
  createIndexes
};
