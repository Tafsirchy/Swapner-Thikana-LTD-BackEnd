const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe, getSubscribers } = require('../controllers/newsletter.controller');
const { protect } = require('../middlewares/auth.middleware');
const rateLimit = require('express-rate-limit');

const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: { message: 'Too many subscription attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post('/subscribe', newsletterLimiter, subscribe);

// @route   GET /api/newsletter/unsubscribe
// @desc    Unsubscribe via token link
// @access  Public
router.get('/unsubscribe', unsubscribe);

// @route   GET /api/newsletter/subscribers
// @desc    Get all subscribers (Admin)
// @access  Private/Admin
router.get('/subscribers', protect, getSubscribers);

module.exports = router;
