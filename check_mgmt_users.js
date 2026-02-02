const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'd:/STLTD/real-estate-backend/.env' });

async function checkUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const managementUsers = await db.collection('users').find({ role: 'management' }).toArray();
    
    console.log(`Found ${managementUsers.length} users with role 'management'.`);
    managementUsers.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name} (${u.email})`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

checkUsers();
