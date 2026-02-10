const multer = require('multer');

// Configure Storage (Memory Storage for ImgBB)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  console.log('[Upload Middleware] Processing file:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    console.warn('[Upload Middleware] Rejected file type:', file.mimetype);
    cb(new Error('Only image files are allowed!'), false);
  }
};

/**
 * Deep Validation Middleware
 * Checks if the buffer is actually a valid image using Sharp
 */
const validateImageBuffer = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const sharp = require('sharp');
    // Attempt to get metadata. If it fails, it's not a valid/supported image
    await sharp(req.file.buffer).metadata();
    next();
  } catch (err) {
    console.error('[Upload Middleware] Deep validation failed:', err.message);
    const ApiResponse = require('../utils/apiResponse');
    return ApiResponse.error(res, 'Invalid image file. The file may be corrupted or spoofed.', 400);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (Reduced from 10MB for optimization)
  },
});

module.exports = {
  upload,
  validateImageBuffer
};
