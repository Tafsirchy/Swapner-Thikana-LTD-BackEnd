const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const { imgbbUpload } = require('../middlewares/imgbb.middleware');
const { protect } = require('../middlewares/auth.middleware');
const ApiResponse = require('../utils/apiResponse');

// @route   POST /api/upload
// @desc    Upload generic image to ImgBB
// @access  Private (Authenticated users only)
router.post('/', protect, upload.single('image'), imgbbUpload, (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      return ApiResponse.error(res, 'No image uploaded', 400);
    }
    
    // Return the ImgBB URL (which is stored in req.file.path by the middleware)
    return ApiResponse.success(res, 'Image uploaded successfully', { url: req.file.path }, 201);
  } catch (error) {
    next(error);
  }
});

/*
// @route   POST /api/upload/public
// @desc    Upload image to ImgBB (Public)
// @access  Public
router.post('/public', upload.single('image'), imgbbUpload, (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      return ApiResponse.error(res, 'No image uploaded', 400);
    }
    return ApiResponse.success(res, 'Image uploaded successfully', { url: req.file.path }, 201);
  } catch (error) {
    next(error);
  }
});
*/

module.exports = router;
