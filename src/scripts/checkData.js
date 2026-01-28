const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const verifyData = async () => {
  let client;
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/shwapner-thikana';
    client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db();
    const collections = ['users', 'blogs', 'projects', 'properties', 'leads', 'notifications', 'saved-searches'];

    console.log('Collection Counts:');
    for (const colName of collections) {
      const count = await db.collection(colName).countDocuments();
      console.log(`${colName}: ${count}`);
    }

    // Sample data check
    const sampleUser = await db.collection('users').findOne({});
    console.log('\nSample User:', sampleUser ? sampleUser.email : 'None');

    const sampleProperty = await db.collection('properties').findOne({});
    console.log('Sample Property:', sampleProperty ? sampleProperty.title : 'None');

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
};

verifyData();
