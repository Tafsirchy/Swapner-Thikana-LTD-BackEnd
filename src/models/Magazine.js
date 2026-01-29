const { getDB } = require('../config/db');

/**
 * Magazine collection helper
 */
const Magazines = () => getDB().collection('magazines');

/**
 * Create indexes for magazines collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('magazines').createIndex({ slug: 1 }, { unique: true });
  await db.collection('magazines').createIndex({ isPublished: 1 });
  await db.collection('magazines').createIndex({ publicationDate: -1 });
};

module.exports = {
  Magazines,
  createIndexes
};
