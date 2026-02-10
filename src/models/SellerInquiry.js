const { getDB } = require('../config/db');

const collectionName = 'SellerInquiries';

const SellerInquiry = () => getDB().collection(collectionName);

/**
 * Create indexes for seller inquiries collection
 * @param {import('mongodb').Db} db 
 */
const createIndexes = async (db) => {
  await db.collection(collectionName).createIndex({ status: 1, createdAt: -1 });
  await db.collection(collectionName).createIndex({ email: 1 });
};

module.exports = { SellerInquiry, createIndexes };

