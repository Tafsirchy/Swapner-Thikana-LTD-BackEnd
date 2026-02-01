const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Public route to submit inquiry
router.post('/submit', sellerController.submitInquiry);

// Admin routes
router.get('/admin/all', protect, authorize('admin', 'management'), sellerController.getAllInquiries);
router.put('/admin/:id/status', protect, authorize('admin', 'management'), sellerController.updateInquiryStatus);

module.exports = router;
