/**
 * Database Migration Script
 * Purpose: Add 'status' field to existing users who don't have it
 * Date: 2026-02-03
 * 
 * USAGE:
 * node src/migrations/add_user_status.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  console.log('🚀 Starting user status migration...\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Count users without status field
    const usersWithoutStatus = await usersCollection.countDocuments({ status: { $exists: false } });
    console.log(`📊 Found ${usersWithoutStatus} users without 'status' field\n`);

    if (usersWithoutStatus === 0) {
      console.log('✅ All users already have status field. Nothing to migrate.\n');
      return;
    }

    // Update users based on their isActive field
    const result = await usersCollection.updateMany(
      { status: { $exists: false } },
      [
        {
          $set: {
            status: {
              $cond: {
                if: { $eq: ['$isActive', false] },
                then: 'inactive',
                else: 'active'
              }
            }
          }
        }
      ]
    );

    console.log(`✅ Migration complete!`);
    console.log(`   - Modified: ${result.modifiedCount} users`);
    console.log(`   - Matched: ${result.matchedCount} users\n`);

    // Verify the migration
    const verification = await usersCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    console.log('📈 User status distribution:');
    verification.forEach(item => {
      console.log(`   - ${item._id || 'null'}: ${item.count} users`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n🎉 Migration script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
