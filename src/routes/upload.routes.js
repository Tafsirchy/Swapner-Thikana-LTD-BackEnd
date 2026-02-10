const express = require('express');
const router = express.Router();
const { upload, validateImageBuffer } = require('../middlewares/upload.middleware');
const { imgbbUpload } = require('../middlewares/imgbb.middleware');
const imageOptimization = require('../middlewares/image-optimization.middleware');
const { protect } = require('../middlewares/auth.middleware');
const ApiResponse = require('../utils/apiResponse');
const rateLimit = require('express-rate-limit');

// Rate limiter specifically for public uploads: 10 uploads per hour per IP
const publicUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased from 10 for testing/dev
  message: 'Too many uploads from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/upload
// @desc    Upload generic image to ImgBB
// @access  Private (Authenticated users only)
router.post('/', protect, upload.single('image'), validateImageBuffer, imgbbUpload, (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      return ApiResponse.error(res, 'No image uploaded', 400);
    }
    
    // Return the full ImgBB metadata object for frontend cleanup and processing
    return ApiResponse.success(res, 'Image uploaded successfully', { url: req.file.path }, 201);

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/upload/public
// @desc    Upload image to ImgBB (Public)
// @access  Public
router.post('/public', publicUploadLimiter, upload.single('image'), (req, res, next) => {
  console.log('[Upload Route] /public hit. Field exists:', !!req.body.image || !!req.file);
  next();
}, validateImageBuffer, imgbbUpload, (req, res, next) => {
  try {
    const fileExists = !!req.file;
    const pathExists = req.file && !!req.file.path;
    
    console.log('[Upload Route] /public validation:', { 
      fileExists, 
      pathExists,
      mimetype: req.file?.mimetype,
      size: req.file?.size
    });

    if (!fileExists || !pathExists) {
      console.error('[Upload Route] Error: No image uploaded or path missing from ImgBB');
      return ApiResponse.error(res, 'No image uploaded', 400);
    }

    return ApiResponse.success(res, 'Image uploaded successfully', { 
      url: typeof req.file.path === 'string' ? req.file.path : req.file.path.url,
      metadata: req.file.path // Include full metadata if available
    }, 201);
  } catch (error) {
    console.error('[Upload Route] Error in final handler:', error);
    // Write error to a file for persistent debugging
    const fs = require('fs');
    const logData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      data: error.data,
      status: error.statusCode || error.status || 500,
      stack: error.stack
    };
    fs.appendFileSync('last_upload_error.log', JSON.stringify(logData, null, 2) + '\n---\n');
    next(error);
  }
});

// @route   DELETE /api/upload/:id
// @desc    Delete image from ImgBB
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const { deleteImage } = require('../utils/storageCleanup');
    // We accept both ID in param and optional delete_url in body for flexibility
    const imageObj = {
      id: req.params.id,
      delete_url: req.body.delete_url
    };

    await deleteImage(imageObj);
    return ApiResponse.success(res, 'Deletion request processed');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
