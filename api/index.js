const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const { initializeFirebase } = require('../src/utils/notificationService');

module.exports = async (req, res) =>{
  // Diagnostic logging for routing issues
  console.log(`[Vercel] Request URL: ${req.url}, Original: ${req.originalUrl}, Method: ${req.method}`);

  // CORS headers at the entry point for maximum reliability
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Auth-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Explicitly handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ensure database connection is established
    await connectDB();
    
    // Initialize firebase for messaging/notifs in serverless
    initializeFirebase();
    
    // Forward request to Express app
    return app(req, res);
  } catch (error) {
    console.error('❌ Serverless function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server configuration error'
    });
  }
};
