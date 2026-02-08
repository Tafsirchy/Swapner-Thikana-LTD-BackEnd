const { uploadToImgbb } = require('../utils/imgbb');

/**
 * Middleware to upload files to ImgBB
 * Expects 'req.file' or 'req.files' to be populated by multer (memory storage)
 */
const imgbbUpload = async (req, res, next) => {
  try {
    const uploadSingle = async (file) => {
      // If image-optimization middleware was used, we have specialized buffers
      if (file.originalBuffer && file.mediumBuffer && file.thumbnailBuffer) {
        const [originalUrl, mediumUrl, thumbUrl] = await Promise.all([
          uploadToImgbb(file.originalBuffer, file.optimizedName || file.originalname),
          uploadToImgbb(file.mediumBuffer, file.mediumName || `med_${file.originalname}`),
          uploadToImgbb(file.thumbnailBuffer, file.thumbnailName || `thumb_${file.originalname}`)
        ]);
        
        // Store as object for advanced frontend usage
        file.path = {
          original: originalUrl,
          medium: mediumUrl,
          thumbnail: thumbUrl,
          processed: true
        };
      } else {
        // Fallback or if optimization was skipped
        const url = await uploadToImgbb(file.buffer, file.originalname);
        file.path = url;
      }
    };

    // Handle single file
    if (req.file) {
      await uploadSingle(req.file);
    }

    // Handle multiple files (array)
    if (req.files && Array.isArray(req.files)) {
      await Promise.all(req.files.map(uploadSingle));
    }

    // Handle multiple files (fields)
    if (req.files && !Array.isArray(req.files)) {
      const fields = Object.keys(req.files);
      for (const field of fields) {
        await Promise.all(req.files[field].map(uploadSingle));
      }
    }

    next();
  } catch (error) {
    console.error('ImgBB Middleware Error:', error);
    next(error);
  }
};

module.exports = { imgbbUpload };
