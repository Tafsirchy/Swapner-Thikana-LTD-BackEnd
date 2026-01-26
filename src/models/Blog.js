const { getDB } = require('../config/db');

/**
 * Blog collection helper
 */
const Blogs = () => getDB().collection('blogs');

/**
 * Create indexes for blogs collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('blogs').createIndex({ slug: 1 }, { unique: true });
  await db.collection('blogs').createIndex({ isPublished: 1, publishedAt: -1 });
};

module.exports = {
  Blogs,
  createIndexes
};
