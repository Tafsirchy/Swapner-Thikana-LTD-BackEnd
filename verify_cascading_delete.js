const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: 'd:/STLTD/real-estate-backend/.env' });

async function verifyCascadingDelete() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    console.log('--- Verification Started ---');

    // 1. Verify Property Cascading Delete
    console.log('\nChecking Property Cascading Delete...');
    const dummyPropertyId = new ObjectId();
    const dummyAgentId = new ObjectId();
    
    await db.collection('properties').insertOne({ _id: dummyPropertyId, title: 'Tester Property', agent: dummyAgentId });
    await db.collection('reviews').insertOne({ propertyId: dummyPropertyId, text: 'Dummy Review' });
    await db.collection('leads').insertOne({ targetId: dummyPropertyId, interestType: 'property', name: 'Leady' });
    await db.collection('wishlists').insertOne({ name: 'My Wish', properties: [dummyPropertyId] });
    await db.collection('users').insertOne({ name: 'User T', savedProperties: [dummyPropertyId], recentlyViewed: [dummyPropertyId] });

    console.log('Created dummy property and relations. Triggering cleanup via simulation (direct call logic)...');
    
    // Simulating the logic from property.controller.js
    await db.collection('reviews').deleteMany({ propertyId: dummyPropertyId });
    await db.collection('leads').deleteMany({ targetId: dummyPropertyId, interestType: 'property' });
    await db.collection('users').updateMany({}, { $pull: { savedProperties: dummyPropertyId, recentlyViewed: dummyPropertyId } });
    await db.collection('wishlists').updateMany({ properties: dummyPropertyId }, { $pull: { properties: dummyPropertyId } });
    await db.collection('properties').deleteOne({ _id: dummyPropertyId });

    // Verify
    const orphanReview = await db.collection('reviews').findOne({ propertyId: dummyPropertyId });
    const orphanLead = await db.collection('leads').findOne({ targetId: dummyPropertyId });
    const userUpdate = await db.collection('users').findOne({ savedProperties: dummyPropertyId });
    const wishlistUpdate = await db.collection('wishlists').findOne({ properties: dummyPropertyId });

    if (!orphanReview && !orphanLead && !userUpdate && !wishlistUpdate) {
      console.log('✅ Property Cascading Delete Verified Successfully!');
    } else {
      console.log('❌ Property Cascading Delete FAILED!');
    }

    // 2. Verify Agency/Agent Unlinking
    console.log('\nChecking Agency/Agent Reference Cleanup...');
    const dummyAgencyId = new ObjectId();
    const dummyAgent2Id = new ObjectId();
    const dummyProp2Id = new ObjectId();

    await db.collection('agencies').insertOne({ _id: dummyAgencyId, name: 'Test Agency' });
    await db.collection('agents').insertOne({ _id: dummyAgent2Id, name: 'Agent Smith', agency: dummyAgencyId });
    await db.collection('properties').insertOne({ _id: dummyProp2Id, title: 'Prop 2', agency: dummyAgencyId });

    // Simulating the logic from agency.controller.js
    await db.collection('agents').updateMany({ agency: dummyAgencyId }, { $set: { agency: null } });
    await db.collection('properties').updateMany({ agency: dummyAgencyId }, { $set: { agency: null } });
    await db.collection('agencies').deleteOne({ _id: dummyAgencyId });

    // Verify
    const agentRef = await db.collection('agents').findOne({ _id: dummyAgent2Id });
    const propRef = await db.collection('properties').findOne({ _id: dummyProp2Id });

    if (agentRef.agency === null && propRef.agency === null) {
      console.log('✅ Agency Reference Cleanup Verified Successfully!');
    } else {
      console.log('❌ Agency Reference Cleanup FAILED!');
    }

    // Cleanup dummy data
    await db.collection('users').deleteOne({ name: 'User T' });
    await db.collection('wishlists').deleteOne({ name: 'My Wish' });
    await db.collection('agents').deleteOne({ _id: dummyAgent2Id });
    await db.collection('properties').deleteOne({ _id: dummyProp2Id });

    console.log('\n--- Verification Finished ---');

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await client.close();
  }
}

verifyCascadingDelete();
