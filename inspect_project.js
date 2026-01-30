const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoUriLine = envContent.split('\n').find(line => line.startsWith('MONGODB_URI='));
let mongoUri = mongoUriLine ? mongoUriLine.split('=')[1].trim() : null;

if (mongoUri && mongoUri.includes('retryWrites') && !mongoUri.includes('retryWrites=true') && !mongoUri.includes('retryWrites=false')) {
  mongoUri = mongoUri.replace('retryWrites', 'retryWrites=true');
}

if (!mongoUri) {
  console.error('MONGODB_URI not found in .env');
  process.exit(1);
}

async function checkProjectStructure() {
  const uri = mongoUri;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('swapner-thikana');
    const projects = database.collection('projects');

    const projectsList = await projects.find({}).limit(5).toArray();
    projectsList.forEach(p => {
      console.log('Location:', JSON.stringify(p.location, null, 2));
      console.log('Amenities:', JSON.stringify(p.amenities, null, 2));
    });
  } finally {
    await client.close();
  }
}

checkProjectStructure().catch(console.dir);
