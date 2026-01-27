const { getDB } = require('../config/db');

/**
 * Review collection helper
 */
const Reviews = () => getDB().collection('reviews');

/**
 * Create indexes for reviews collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('reviews').createIndex({ propertyId: 1, status: 1 });
  await db.collection('reviews').createIndex({ agentId: 1, status: 1 });
  await db.collection('reviews').createIndex({ userId: 1 });
  await db.collection('reviews').createIndex({ createdAt: -1 });
};

module.exports = {
  Reviews,
  createIndexes
};
