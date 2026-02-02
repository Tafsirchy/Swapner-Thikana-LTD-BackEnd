const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'd:/STLTD/real-estate-backend/.env' });

async function checkManagement() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const members = await db.collection('management').find({}).toArray();
    
    console.log(`Found ${members.length} management members.`);
    members.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name} - ${m.role}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

checkManagement();
