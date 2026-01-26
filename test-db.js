require('dotenv').config();
const connectDB = require('./src/config/db');

// Test MongoDB connection
const testConnection = async () => {
  console.log('\n🔍 Testing MongoDB Atlas Connection...\n');
  console.log('Database URI:', process.env.MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));
  
  try {
    await connectDB();
    console.log('\n✅ MongoDB Connection Test PASSED!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Test FAILED!');
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testConnection();
