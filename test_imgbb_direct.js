const { uploadToImgbb } = require('./src/utils/imgbb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function testUpload() {
  console.log('Testing ImgBB Upload...');
  let apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    // Try the other .env file
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    apiKey = process.env.IMGBB_API_KEY;
  }
  
  apiKey = apiKey?.trim().replace(/^["']|["']$/g, '');
  console.log('API Key present:', !!apiKey);
  console.log('API Key length:', apiKey?.length);
  console.log('API Key start:', apiKey?.substring(0, 4));
  
  process.env.IMGBB_API_KEY = apiKey; // Set it back for the utility

  try {
    // Create a small dummy image buffer (1x1 red dot pixel)
    const dummyBuffer = Buffer.from('R0lGODlhAQABAIAAAAD/AP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    const result = await uploadToImgbb(dummyBuffer, 'test_dot.gif');
    console.log('Upload successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Upload failed!');
    console.error('Error:', error.message);
  }
}

testUpload();
