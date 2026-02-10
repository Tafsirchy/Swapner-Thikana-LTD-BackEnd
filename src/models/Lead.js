const { getDB } = require('../config/db');

/**
 * Lead collection helper
 */
const Leads = () => getDB().collection('leads');

/**
 * Create indexes for leads collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection('leads').createIndex({ status: 1, createdAt: -1 });
  await db.collection('leads').createIndex({ user: 1 });
  await db.collection('leads').createIndex({ email: 1 });
  await db.collection('leads').createIndex({ agent: 1 });
  await db.collection('leads').createIndex({ targetId: 1 });

};

module.exports = {
  Leads,
  createIndexes
};
