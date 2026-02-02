const axios = require('axios');
require('dotenv').config({ path: 'd:/STLTD/real-estate-backend/.env' });

async function verifyBackend() {
  const port = process.env.PORT || 5000;
  const baseUrl = `http://localhost:${port}/api`;
  
  try {
    // We need an admin token to check dashboard stats
    // Since I don't have a token handy, I'll check the DB counts directly again
    // but this time I'll use the same logic as the controller
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    const usersCollection = db.collection('users');
    const managementCollection = db.collection('management');
    
    const managementUsers = await usersCollection.countDocuments({ role: 'management' });
    const leadershipProfiles = await managementCollection.countDocuments();
    
    console.log('--- Logical Verification ---');
    console.log(`Management Users Count: ${managementUsers}`);
    console.log(`Leadership Profiles Count: ${leadershipProfiles}`);
    
    if (managementUsers > 0 && leadershipProfiles > 0) {
      console.log('✅ Backend data is present and ready.');
    } else {
      console.log('⚠️ Backend data counts are zero or missing.');
    }
    
    await client.close();
  } catch (err) {
    console.error('Verification failed:', err.message);
  }
}

verifyBackend();
