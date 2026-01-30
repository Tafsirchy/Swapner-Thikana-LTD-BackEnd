const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'd:/STLTD/real-estate-backend/.env' });

async function checkData() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/stltd');
  try {
    await client.connect();
    const db = client.db();
    const properties = await db.collection('properties').find({}).limit(5).toArray();
    
    console.log('--- Sample Property Data Types ---');
    properties.forEach(p => {
      console.log(`Title: ${p.title}`);
      console.log(`  price: ${typeof p.price} (${p.price})`);
      console.log(`  area: ${typeof p.area} (${p.area})`);
      console.log(`  size: ${typeof p.size} (${p.size})`);
      console.log(`  views: ${typeof p.views} (${p.views})`);
      console.log(`  featured: ${typeof p.featured} (${p.featured})`);
      console.log(`  bedrooms: ${typeof p.bedrooms} (${p.bedrooms})`);
      console.log(`  bathrooms: ${typeof p.bathrooms} (${p.bathrooms})`);
      console.log(`  propertyType: ${typeof p.propertyType} (${p.propertyType})`);
      console.log(`  amenities: ${Array.isArray(p.amenities) ? 'Array' : typeof p.amenities} (${JSON.stringify(p.amenities)})`);
      console.log(`  createdAt: ${p.createdAt instanceof Date ? 'Date' : typeof p.createdAt} (${p.createdAt})`);
      console.log('---------------------------');
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

checkData();
