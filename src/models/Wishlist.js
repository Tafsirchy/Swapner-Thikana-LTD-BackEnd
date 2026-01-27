const { getDB } = require('../config/db');

/**
 * Wishlist collection helper
 */
const Wishlists = () => getDB().collection('wishlists');

/**
 * Create indexes for wishlists collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('wishlists').createIndex({ user: 1 });
  await db.collection('wishlists').createIndex({ name: 1 });
};

module.exports = {
  Wishlists,
  createIndexes
};
