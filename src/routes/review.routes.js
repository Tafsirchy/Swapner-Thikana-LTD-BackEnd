const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Public routes
router.get('/property/:propertyId', reviewController.getPropertyReviews);
router.get('/agent/:agentId', reviewController.getAgentReviews);

// Protected routes (User)
router.post('/', protect, reviewController.createReview);
router.delete('/:id', protect, reviewController.deleteReview); // Owner or Admin

// Admin routes
router.get('/admin/all', protect, authorize('admin'), reviewController.getAllReviewsAdmin);
router.put('/:id/status', protect, authorize('admin'), reviewController.updateReviewStatus);

module.exports = router;
