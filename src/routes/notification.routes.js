const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  registerFcmToken,
  sendTestNotification
} = require('../controllers/notification.controller');

// All routes require authentication
router.use(protect);

// Get notifications and create new one
router.route('/')
  .get(getNotifications)
  .post(createNotification);

// Mark all as read
router.put('/read-all', markAllAsRead);

// Register FCM token
router.post('/fcm-token', registerFcmToken);

// Add POST /test route
router.post('/test', sendTestNotification);

// Single notification operations
router.route('/:id')
  .delete(deleteNotification);

router.put('/:id/read', markAsRead);

module.exports = router;
