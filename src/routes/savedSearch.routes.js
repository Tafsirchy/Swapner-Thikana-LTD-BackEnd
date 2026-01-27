const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createSavedSearch,
  getSavedSearches,
  getSavedSearchById,
  updateSavedSearch,
  deleteSavedSearch,
  getSearchMatches
} = require('../controllers/savedSearch.controller');

// All routes require authentication
router.use(protect);

// Create and list saved searches
router.route('/')
  .post(createSavedSearch)
  .get(getSavedSearches);

// Single saved search operations
router.route('/:id')
  .get(getSavedSearchById)
  .put(updateSavedSearch)
  .delete(deleteSavedSearch);

// Get matching properties for a search
router.get('/:id/matches', getSearchMatches);

module.exports = router;
