const { uploadToImgbb } = require('../utils/imgbb');

/**
 * Middleware to upload files to ImgBB
 * Expects 'req.file' or 'req.files' to be populated by multer (memory storage)
 */
const imgbbUpload = async (req, res, next) => {
  try {
    // Handle single file
    if (req.file) {
      const url = await uploadToImgbb(req.file.buffer, req.file.originalname);
      req.file.path = url; // Overwrite path with ImgBB URL
    }

    // Handle multiple files (array)
    if (req.files && Array.isArray(req.files)) {
      const uploadPromises = req.files.map(async (file) => {
        const url = await uploadToImgbb(file.buffer, file.originalname);
        file.path = url;
        return file;
      });
      await Promise.all(uploadPromises);
    }

    // Handle multiple files (fields)
    if (req.files && !Array.isArray(req.files)) {
      const fields = Object.keys(req.files);
      for (const field of fields) {
        const files = req.files[field];
        const uploadPromises = files.map(async (file) => {
          const url = await uploadToImgbb(file.buffer, file.originalname);
          file.path = url;
          return file;
        });
        await Promise.all(uploadPromises);
      }
    }

    next();
  } catch (error) {
    console.error('ImgBB Middleware Error:', error);
    next(error);
  }
};

module.exports = { imgbbUpload };
