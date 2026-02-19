require('dotenv').config();
const { getDB, connectDB } = require('./src/config/db');

async function checkSubscribers() {
  await connectDB();
  const db = getDB();
  const subscribers = await db.collection('newsletters').find({}).toArray();
  console.log('--- ALL SUBSCRIBERS ---');
  console.log(JSON.stringify(subscribers, null, 2));
  process.exit(0);
}

checkSubscribers();
