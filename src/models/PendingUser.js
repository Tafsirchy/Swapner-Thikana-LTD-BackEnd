const { getDB } = require('../config/db');

/**
 * PendingUser collection helper
 */
const PendingUsers = () => getDB().collection('pendingusers');

/**
 * Create indexes for pendingusers collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  // Unique index on email to prevent duplicates
  await db.collection('pendingusers').createIndex({ email: 1 }, { unique: true });
  
  // Index on verificationToken for fast lookup (hashed)
  await db.collection('pendingusers').createIndex({ verificationToken: 1 });

  // TTL Index: Documents expire automatically after 24 hours (86400 seconds)
  // 'createdAt' field must be a Date object
  await db.collection('pendingusers').createIndex(
    { createdAt: 1 }, 
    { expireAfterSeconds: 86400 }
  );
};

module.exports = {
  PendingUsers,
  createIndexes
};
