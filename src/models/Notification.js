const { getDB } = require('../config/db');

/**
 * Notification collection helper
 */
const Notifications = () => getDB().collection('notifications');

/**
 * Create indexes for notifications collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('notifications').createIndex({ user: 1 });
  await db.collection('notifications').createIndex({ isRead: 1 });
  await db.collection('notifications').createIndex({ createdAt: -1 });
  await db.collection('notifications').createIndex({ user: 1, isRead: 1 });
  
  // TTL index to automatically delete notifications after 30 days
  // 30 days = 30 * 24 * 60 * 60 = 2,592,000 seconds
  await db.collection('notifications').createIndex(
    { createdAt: 1 }, 
    { expireAfterSeconds: 2592000 }
  );
};

module.exports = {
  Notifications,
  createIndexes
};
