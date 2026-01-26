/**
 * Slugify a string
 * @param {string} text - Text to slugify
 * @returns {string} - Slugified text
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/--+/g, '-'); // Replace multiple - with single -
};

/**
 * Generate unique slug with timestamp
 * @param {string} text - Base text
 * @returns {string} - Unique slug
 */
const generateUniqueSlug = (text) => {
  const baseSlug = slugify(text);
  const timestamp = Date.now();
  return `${baseSlug}-${timestamp}`;
};

module.exports = {
  slugify,
  generateUniqueSlug,
};
