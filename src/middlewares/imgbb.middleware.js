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
        const [originalData, mediumData, thumbData] = await Promise.all([
          uploadToImgbb(file.originalBuffer, file.optimizedName || file.originalname),
          uploadToImgbb(file.mediumBuffer, file.mediumName || `med_${file.originalname}`),
          uploadToImgbb(file.thumbnailBuffer, file.thumbnailName || `thumb_${file.originalname}`)
        ]);
        
        // Store as object for advanced frontend usage
        file.path = {
          original: originalData.url,
          medium: mediumData.url,
          thumbnail: thumbData.url,
          processed: true,
          // Store deletion metadata for cleanup
          delete: {
            original: originalData.delete_url,
            medium: mediumData.delete_url,
            thumbnail: thumbData.delete_url,
            ids: {
              original: originalData.id,
              medium: mediumData.id,
              thumbnail: thumbData.id
            }
          }
        };
      } else {
        // Fallback or if optimization was skipped
        const data = await uploadToImgbb(file.buffer, file.originalname);
        // Structure compatible with SmartImage (src.url) and allowing cleanup
        file.path = {
          url: data.url,
          delete_url: data.delete_url,
          id: data.id
        };
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
    console.error('ImgBB Middleware Error:', error.message);
    if (error.response?.data) {
      console.error('ImgBB API Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    next(error);
  }
};

module.exports = { imgbbUpload };
