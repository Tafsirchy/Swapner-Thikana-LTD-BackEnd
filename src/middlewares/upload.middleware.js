const multer = require('multer');
const path = require('path');
const ApiResponse = require('../utils/apiResponse');

// Standard Multer configuration for memory storage
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

/**
 * Handle Multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.error(res, 'File size too large. Max limit is 5MB.', 400);
    }
    return ApiResponse.error(res, err.message, 400);
  } else if (err) {
    return ApiResponse.error(res, err.message, 400);
  }
  next();
};

module.exports = {
  upload,
  handleUploadError,
};
