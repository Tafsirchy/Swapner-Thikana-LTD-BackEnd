const { connectDB, closeDB } = require('../config/db');
require('dotenv').config();
const { Regions, ALLOWED_REGIONS } = require('../models/Region');

async function verifyRegions() {
  try {
    console.log('--- Database Verification Starting ---');
    
    // Connect to Database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Expected Regions
    const expectedRegions = ALLOWED_REGIONS;

    // Check Regions
    const regions = await Regions().find({ id: { $in: expectedRegions } }).toArray();
    
    console.log(`Found ${regions.length} / ${expectedRegions.length} regions.`);

    const foundIds = regions.map(r => r.id);
    const missingIds = expectedRegions.filter(id => !foundIds.includes(id));

    if (missingIds.length > 0) {
      console.error('❌ Error: Missing regions in database:', missingIds.join(', '));
      await closeDB();
      process.exit(1);
    }

    console.log('✅ All 8 Bangladesh regions verified in database.');
    
    console.log('--- Verification Successful ✅ ---');
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification Failed:', error.message);
    try {
      await closeDB();
    } catch (e) {}
    process.exit(1);
  }
}

verifyRegions();
