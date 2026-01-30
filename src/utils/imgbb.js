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
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error('IMGBB_API_KEY is missing');
    }

    const formData = new FormData();
    formData.append('image', buffer.toString('base64'));
    if (filename) {
      formData.append('name', filename);
    }

    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (response.data && response.data.data && response.data.data.url) {
      return response.data.data.url;
    } else {
      throw new Error('Failed to get URL from ImgBB response');
    }
  } catch (error) {
    console.error('ImgBB Upload Error:', error.response?.data || error.message);
    throw new Error('Failed to upload image to ImgBB');
  }
};

module.exports = { uploadToImgbb };
