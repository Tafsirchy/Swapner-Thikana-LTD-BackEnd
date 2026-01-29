const { getDB } = require('../config/db');

/**
 * Agency collection helper
 */
const Agencies = () => getDB().collection('agencies');

/**
 * Create indexes for agencies collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('agencies').createIndex({ slug: 1 }, { unique: true });
  await db.collection('agencies').createIndex({ name: 1 });
};

module.exports = {
  Agencies,
  createIndexes
};
