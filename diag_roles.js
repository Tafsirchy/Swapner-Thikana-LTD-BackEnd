const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'd:/STLTD/real-estate-backend/.env' });

async function checkUserRoles() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    console.log('--- User Roles Diagnostic ---');
    const roles = await db.collection('users').aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('Current roles in DB:', roles);
    
    const managementUsers = await db.collection('users').find({ role: 'management' }).toArray();
    console.log('\nManagement Users Sample:', managementUsers.map(u => ({ email: u.email, role: u.role, isActive: u.isActive })));

    const adminUsers = await db.collection('users').find({ role: 'admin' }).toArray();
    console.log('\nAdmin Users Sample:', adminUsers.map(u => ({ email: u.email, role: u.role, isActive: u.isActive })));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

checkUserRoles();
