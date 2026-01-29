const { getDB } = require('../config/db');

/**
 * Agent collection helper
 */
const Agents = () => getDB().collection('agents');

/**
 * Create indexes for agents collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('agents').createIndex({ email: 1 }, { unique: true });
  await db.collection('agents').createIndex({ status: 1 });
};

module.exports = {
  Agents,
  createIndexes
};
