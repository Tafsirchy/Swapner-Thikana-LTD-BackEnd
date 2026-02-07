const { getDB, connectDB } = require('../config/db');
require('dotenv').config();

/**
 * Seed initial 8 regions for Bangladesh Master Plan
 */
const seedRegions = async () => {
  try {
    await connectDB();
    const db = getDB();
    
    const initialRegions = [
      {
        id: 'dhaka',
        name: 'Dhaka',
        image: '',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mymensingh',
        name: 'Mymensingh',
        image: '',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rajshahi',
        name: 'Rajshahi',
        image: '',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'sylhet',
        name: 'Sylhet',
        image: '',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'chittagong',
        name: 'Chittagong',
        image: '',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rangpur',
        name: 'Rangpur',
        image: '',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'khulna',
        name: 'Khulna',
        image: '',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'barisal',
        name: 'Barisal',
        image: '',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Check if regions already exist
    const existingCount = await db.collection('regions').countDocuments();
    
    if (existingCount > 0) {
      console.log(`✓ Regions already seeded (${existingCount} regions found)`);
      return;
    }

    // Insert all regions
    const result = await db.collection('regions').insertMany(initialRegions);
    
    console.log(`✓ Successfully seeded ${result.insertedCount} regions`);
    console.log('  Regions:', initialRegions.map(r => r.name).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding regions:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedRegions();
}

module.exports = seedRegions;
