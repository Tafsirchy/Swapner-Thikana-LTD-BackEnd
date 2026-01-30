const { getDB } = require('../config/db');

const collectionName = 'SellerInquiries';

const SellerInquiry = () => getDB().collection(collectionName);

module.exports = { SellerInquiry };
