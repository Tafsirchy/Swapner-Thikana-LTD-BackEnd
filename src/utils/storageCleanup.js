const axios = require('axios');

/**
 * Attempt to delete an image from ImgBB using its delete_url or ID.
 * Note: ImgBB Public API does not strictly support programmatic delete via API Key for anonymous uploads
 * without scraping the delete_url. This function prepares for that or future Cloudinary switch.
 * 
 * @param {Object} imageObj - The image object stored in DB ({url, delete_url, id} or structure with .delete)
 */
const deleteImage = async (imageObj) => {
  if (!imageObj) return;

  try {
    // 1. Check for optimized structure
    if (imageObj.delete && imageObj.delete.ids) {
       // We have IDs for original, medium, thumbnail
       // Currently just logging as ImgBB API doesn't allow direct delete by ID easily without full auth context
       console.log(`[StorageCleanup] Pending delete for IDs:`, imageObj.delete.ids);
       // Future: await axios.delete(...)
    } 
    // 2. Check for simple structure
    else if (imageObj.delete_url) {
       console.log(`[StorageCleanup] Orphaned Image Delete URL: ${imageObj.delete_url}`);
       // Optionally call the URL if it was a direct api endpoint
    }
  } catch (error) {
    console.error('[StorageCleanup] Error processing image deletion:', error.message);
  }
};

module.exports = { deleteImage };
