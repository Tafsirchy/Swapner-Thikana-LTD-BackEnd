const { getDB } = require('../config/db');

/**
 * Reminders collection helper
 */
const Reminders = () => getDB().collection('reminders');

/**
 * Create indexes for reminders collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('reminders').createIndex({ user: 1, dueDate: 1 });
  await db.collection('reminders').createIndex({ isCompleted: 1 });
  await db.collection('reminders').createIndex({ isSent: 1 });
};

module.exports = {
  Reminders,
  createIndexes
};
