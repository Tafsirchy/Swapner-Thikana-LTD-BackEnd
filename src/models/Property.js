const { getDB } = require('../config/db');

/**
 * Property collection helper
 */
const Properties = () => getDB().collection('properties');

/**
 * Create indexes for properties collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('properties').createIndex({ slug: 1 }, { unique: true });
  await db.collection('properties').createIndex({ 'location.city': 1, 'location.area': 1 });
  await db.collection('properties').createIndex({ propertyType: 1, listingType: 1, status: 1 });
  await db.collection('properties').createIndex({ price: 1 });
  await db.collection('properties').createIndex({ featured: 1, createdAt: -1 });
  await db.collection('properties').createIndex({ agent: 1 });
};

module.exports = {
  Properties,
  createIndexes
};
