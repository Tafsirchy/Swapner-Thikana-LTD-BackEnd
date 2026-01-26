require('dotenv').config();
const connectDB = require('./config/db');

console.log('\n🔍 Testing MongoDB Connection...\n');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set ✓' : 'Not Set ✗');
console.log('Environment:', process.env.NODE_ENV || 'development');

const testConnection = async () => {
  try {
    await connectDB();
    console.log('\n✅ MongoDB Connection Test PASSED!');
    console.log('✅ Database is ready to use\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Test FAILED!');
    console.error('Error:', error.message);
    console.error('\n⚠️  Please check:');
    console.error('   1. MongoDB URI in .env file');
    console.error('   2. Network connection');
    console.error('   3. MongoDB Atlas IP whitelist\n');
    process.exit(1);
  }
};

testConnection();
