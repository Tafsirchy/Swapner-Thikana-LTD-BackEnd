/**
 * Maps a sort string to a MongoDB sort object.
 * Supports named aliases and legacy -field formats.
 * @param {string} sortStr 
 * @returns {object}
 */
const getSortObject = (sortStr) => {
  const s = String(sortStr || '').trim();
  
  // Named Aliases
  if (s === 'newest' || s === '-createdAt') return { createdAt: -1 };
  if (s === 'oldest' || s === 'createdAt') return { createdAt: 1 };
  if (s === 'price-asc' || s === 'price') return { price: 1 };
  if (s === 'price-desc' || s === '-price') return { price: -1 };
  // Frontend displays 'size' primarily, so we sort by 'size'
  if (s === 'area-desc' || s === '-area' || s === 'size-desc') return { size: -1 };
  if (s === 'area-asc' || s === 'size-asc') return { size: 1 };
  if (s === 'popular' || s === '-views') return { views: -1, createdAt: -1 };
  if (s === 'featured') return { featured: -1, createdAt: -1 };

  // Generic fallback for -field or field
  const sortObj = {};
  if (s.startsWith('-')) {
    sortObj[s.substring(1)] = -1;
  } else if (s) {
    sortObj[s] = 1;
  } else {
    // Default default
    return { createdAt: -1 };
  }

  // Safety: always have a fallback sort key if not already present
  if (Object.keys(sortObj).length === 0) return { createdAt: -1 };
  
  return sortObj;
};

/**
 * Safely parses a numeric string, Returning undefined if invalid or empty.
 * @param {any} val 
 * @returns {number|undefined}
 */
const parseNumeric = (val) => {
  if (val === undefined || val === null || val === '') return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
};

module.exports = {
  getSortObject,
  parseNumeric
};
