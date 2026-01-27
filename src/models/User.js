const { getDB } = require('../config/db');

/**
 * User collection helper
 */
const Users = () => getDB().collection('users');

/**
 * Create indexes for users collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ role: 1 });
  await db.collection('users').createIndex({ fcmTokens: 1 });
};

module.exports = {
  Users,
  createIndexes
};
