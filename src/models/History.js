const { getDB } = require('../config/db');

/**
 * History collection helper
 */
const History = () => getDB().collection('history');

/**
 * Create indexes for history collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('history').createIndex({ year: 1 });
  await db.collection('history').createIndex({ order: 1 });
  await db.collection('history').createIndex({ status: 1 });
};

module.exports = {
  History,
  createIndexes
};
