const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const sharp = require('sharp');
const imageOptimization = require('../middlewares/image-optimization.middleware');
const { imgbbUpload } = require('../middlewares/imgbb.middleware');

// Mock req, res, next
const mockRes = {};
const mockNext = (err) => {
  if (err) console.error('Next Error:', err);
};

async function testPipeline() {
  console.log('🧪 Starting Backend Optimization Pipeline Test...');

  // 1. Load a sample image (using the logo from frontend public if available, or any image)
  const sampleImagePath = path.join(__dirname, '../../real-estate-frontend/public/logo-new.png');
  
  if (!fs.existsSync(sampleImagePath)) {
    console.warn('⚠️ Sample image not found at:', sampleImagePath);
    console.log('Creating a dummy buffer to test Sharp...');
    // Create a 100x100 red png buffer
    const dummyBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    }).png().toBuffer();
    
    fs.writeFileSync('dummy.png', dummyBuffer);
    var targetPath = 'dummy.png';
  } else {
    var targetPath = sampleImagePath;
  }

  const buffer = fs.readFileSync(targetPath);
  
  const mockReq = {
    file: {
      buffer: buffer,
      originalname: 'test-image.png',
      mimetype: 'image/png'
    }
  };

  console.log('Step 1: Running imageOptimization middleware...');
  await imageOptimization(mockReq, mockRes, mockNext);

  if (mockReq.file.originalBuffer && mockReq.file.mediumBuffer && mockReq.file.thumbnailBuffer) {
    console.log('✅ Sharp optimization successful!');
    console.log(`   - Original AVIF Buffer Size: ${(mockReq.file.originalBuffer.length / 1024).toFixed(2)}KB`);
    console.log(`   - Medium WebP Buffer Size: ${(mockReq.file.mediumBuffer.length / 1024).toFixed(2)}KB`);
    console.log(`   - Thumbnail WebP Buffer Size: ${(mockReq.file.thumbnailBuffer.length / 1024).toFixed(2)}KB`);
  } else {
    console.error('❌ Sharp optimization failed or was skipped.');
    console.log('Buffers present:', {
      original: !!mockReq.file.originalBuffer,
      medium: !!mockReq.file.mediumBuffer,
      thumbnail: !!mockReq.file.thumbnailBuffer
    });
    return;
  }

  console.log('\nStep 2: Running imgbbUpload middleware (will attempt live upload if API key exists)...');
  
  if (!process.env.IMGBB_API_KEY) {
    console.warn('⚠️ IMGBB_API_KEY missing. Skipping live upload test.');
  } else {
    try {
      await imgbbUpload(mockReq, mockRes, () => {});
      console.log('✅ ImgBB upload successful!');
      console.log('🚀 Final Result Object:', JSON.stringify(mockReq.file.path, null, 2));
    } catch (error) {
      console.error('❌ ImgBB upload failed:', error.message);
    }
  }

  // Cleanup dummy
  if (fs.existsSync('dummy.png')) fs.unlinkSync('dummy.png');
}

testPipeline();
