const { MongoClient } = require('mongodb');

let db = null;
let client = null;

const connectDB = async () => {
  if (db) return db;

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    client = new MongoClient(uri);

    // Connection events logging
    client.on('open', () => console.log('📡 MongoDB connection opened'));
    client.on('close', () => console.log('📡 MongoDB connection closed'));
    client.on('error', (err) => console.error(`❌ MongoDB Driver Error: ${err.message}`));

    await client.connect();
    
    // Get database name from URI or default to 'shwapner_thikana'
    const dbName = uri.split('/').pop().split('?')[0] || 'shwapner_thikana';
    db = client.db(dbName);

    // Initialize indexes
    const { createIndexes: createUserIndexes } = require('../models/User');
    const { createIndexes: createPropertyIndexes } = require('../models/Property');
    const { createIndexes: createProjectIndexes } = require('../models/Project');
    const { createIndexes: createLeadIndexes } = require('../models/Lead');
    const { createIndexes: createBlogIndexes } = require('../models/Blog');
    const { createIndexes: createNotificationIndexes } = require('../models/Notification');
    const { createIndexes: createSavedSearchIndexes } = require('../models/SavedSearch');
    const { createIndexes: createAgentIndexes } = require('../models/Agent');
    const { createIndexes: createManagementIndexes } = require('../models/Management');
    const { createIndexes: createHistoryIndexes } = require('../models/History');
    const { createIndexes: createPendingUserIndexes } = require('../models/PendingUser');

    await Promise.all([
      createUserIndexes(db),
      createPropertyIndexes(db),
      createProjectIndexes(db),
      createLeadIndexes(db),
      createBlogIndexes(db),
      createNotificationIndexes(db),
      createSavedSearchIndexes(db),
      createAgentIndexes(db),
      createManagementIndexes(db),
      createHistoryIndexes(db),
      createPendingUserIndexes(db),
    ]);

    console.log(`✅ MongoDB Connected and indexes initialized: ${dbName}`);
    
    return db;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Throw error instead of process.exit for serverless compatibility
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

const getClient = () => client;

const closeDB = async () => {
  if (client) {
    await client.close();
    console.log('👋 MongoDB connection closed');
    db = null;
    client = null;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  getDB,
  getClient,
  closeDB
};
