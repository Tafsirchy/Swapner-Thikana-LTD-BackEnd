const axios = require('axios');
const FormData = require('form-data');

/**
 * Upload image to ImgBB
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Original filename
 * @returns {Promise<string>} - URL of the uploaded image
 */
const uploadToImgbb = async (buffer, filename) => {
  try {
    const apiKey = process.env.IMGBB_API_KEY?.trim().replace(/^["']|["']$/g, '');
    if (!apiKey) {
      throw new Error('IMGBB_API_KEY is missing');
    }

    const formData = new FormData();
    // Use raw buffer instead of base64 for more reliability with FormData library
    formData.append('image', buffer, { 
      filename: filename || 'upload.jpg',
      contentType: 'image/jpeg' 
    });

    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000, // Increased to 60 seconds
    });

    if (response.data && response.data.data && response.data.data.url) {
      return response.data.data;
    } else {
      throw new Error('Failed to get URL from ImgBB response');
    }
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error('ImgBB Upload Error:', JSON.stringify(errorData, null, 2));
    
    const message = error.response?.data?.error?.message || 'Failed to upload image to ImgBB';
    const err = new Error(message);
    err.statusCode = error.response?.status || 500; // Use statusCode for consistency
    err.data = errorData;
    throw err;
  }
};

module.exports = { uploadToImgbb };
