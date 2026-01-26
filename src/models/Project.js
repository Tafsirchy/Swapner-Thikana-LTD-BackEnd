const { getDB } = require('../config/db');

/**
 * Project collection helper
 */
const Projects = () => getDB().collection('projects');

/**
 * Create indexes for projects collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('projects').createIndex({ slug: 1 }, { unique: true });
  await db.collection('projects').createIndex({ status: 1 });
};

module.exports = {
  Projects,
  createIndexes
};
