const sharp = require('sharp');
const path = require('path');

/**
 * Middleware to optimize images before uploading to ImgBB
 * Converts to WebP, resizes large images, and generates thumbnails
 */
const imageOptimization = async (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next();
  }

  try {
    const processImage = async (file) => {
      // 1. Convert/Optimize Original to AVIF (Next-Gen)
      // We set a max width of 2000px for the "original" to prevent extreme storage usage
      const optimizedBuffer = await sharp(file.buffer)
        .rotate() // Auto-rotate based on EXIF
        .resize({ width: 2000, withoutEnlargement: true })
        .avif({ quality: 65 }) // AVIF offers better compression at lower quality settings
        .toBuffer();

      // 2. Generate Medium Asset (800px width - WebP)
      const mediumBuffer = await sharp(file.buffer)
        .rotate()
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // 3. Generate Thumbnail (400px width - WebP)
      const thumbnailBuffer = await sharp(file.buffer)
        .rotate()
        .resize({ width: 400, height: 400, fit: 'cover' })
        .webp({ quality: 75 })
        .toBuffer();

      // Update file object for next middleware
      file.originalBuffer = optimizedBuffer;
      file.mediumBuffer = mediumBuffer;
      file.thumbnailBuffer = thumbnailBuffer;
      
      // Update metadata to reflect Next-Gen formats
      const fileNameWithoutExt = path.parse(file.originalname).name;
      file.optimizedName = `${fileNameWithoutExt}.avif`;
      file.mediumName = `${fileNameWithoutExt}_medium.webp`;
      file.thumbnailName = `${fileNameWithoutExt}_thumb.webp`;
      
      return file;
    };

    if (req.file) {
      await processImage(req.file);
    }

    if (req.files && Array.isArray(req.files)) {
      await Promise.all(req.files.map(processImage));
    }

    if (req.files && !Array.isArray(req.files)) {
      const fields = Object.keys(req.files);
      for (const field of fields) {
        await Promise.all(req.files[field].map(processImage));
      }
    }

    next();
  } catch (error) {
    console.error('Image Optimization Middleware Error:', error);
    // Continue without optimization if sharp fails (graceful degradation)
    next();
  }
};

module.exports = imageOptimization;
