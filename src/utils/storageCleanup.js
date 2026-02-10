const axios = require('axios');

/**
 * Attempt to delete an image from ImgBB using its delete_url or ID.
 * 
 * @param {Object} imageObj - The image object stored in DB ({url, delete_url, id} or structure with .delete)
 */
const deleteImage = async (imageObj) => {
  if (!imageObj) return;

  try {
    const apiKey = process.env.IMGBB_API_KEY;
    
    // 1. Check for optimized structure (Original, Medium, Thumbnail)
    if (imageObj.delete && imageObj.delete.ids) {
       console.log(`[StorageCleanup] Processing multi-variant deletion for: ${imageObj.original || 'image'}`);
       
       const variantKeys = ['original', 'medium', 'thumbnail'];
       
       // Attempt to delete each variant using its ID if available
       for (const variant of variantKeys) {
         const id = imageObj.delete.ids[variant];
         const deleteUrl = imageObj.delete[variant];
         
         if (id && apiKey) {
           try {
             // ImgBB API supports deletion via ID with API key
             // Note: This often requires standard API access. 
             await axios.delete(`https://api.imgbb.com/1/image/${id}?key=${apiKey}`);
             console.log(`[StorageCleanup] Deleted variant ${variant} (ID: ${id})`);
           } catch (apiError) {
             console.warn(`[StorageCleanup] API Delete failed for ${variant}, trying delete_url:`, apiError.message);
             if (deleteUrl) await axios.get(deleteUrl).catch(() => {});
           }
         } else if (deleteUrl) {
           // Fallback to hitting the delete page URL (Best effort)
           await axios.get(deleteUrl).catch(() => {});
         }
       }
    } 
    // 2. Check for simple structure
    else if (imageObj.id && apiKey) {
       console.log(`[StorageCleanup] Attempting API delete for ID: ${imageObj.id}`);
       await axios.delete(`https://api.imgbb.com/1/image/${imageObj.id}?key=${apiKey}`);
    } 
    else if (imageObj.delete_url) {
       console.log(`[StorageCleanup] Attempting best-effort delete via URL: ${imageObj.delete_url}`);
       await axios.get(imageObj.delete_url).catch(() => {});
    }
  } catch (error) {
    console.error('[StorageCleanup] Error processing image deletion:', error.response?.data || error.message);
  }
};

module.exports = { deleteImage };
