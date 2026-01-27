const { Notifications } = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;

    const query = { user: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notifications()
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .toArray();

    const unreadCount = await Notifications().countDocuments({
      user: req.user._id,
      isRead: false
    });

    return ApiResponse.success(res, 'Notifications retrieved', {
      notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notifications().findOneAndUpdate(
      { _id: new ObjectId(id), user: req.user._id },
      { $set: { isRead: true } },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return ApiResponse.error(res, 'Notification not found', 404);
    }

    return ApiResponse.success(res, 'Notification marked as read', { notification });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notifications().updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return ApiResponse.success(res, 'All notifications marked as read', {
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await Notifications().deleteOne({
      _id: new ObjectId(id),
      user: req.user._id
    });

    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Notification not found', 404);
    }

    return ApiResponse.success(res, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create notification (internal use)
 * @route   POST /api/notifications
 * @access  Private (Admin or system)
 */
const createNotification = async (req, res, next) => {
  try {
    const { userId, type, title, message, link, metadata } = req.body;

    if (!userId || !type || !title || !message) {
      return ApiResponse.error(res, 'Missing required fields', 400);
    }

    const notification = {
      user: new ObjectId(userId),
      type,
      title,
      message,
      link,
      isRead: false,
      metadata: metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Notifications().insertOne(notification);
    notification._id = result.insertedId;

    return ApiResponse.success(res, 'Notification created', { notification }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to create notification (for use in other controllers)
 */
const createNotificationHelper = async (userId, type, title, message, link = null, metadata = {}) => {
  try {
    await Notifications().insertOne({
      user: new ObjectId(userId),
      type,
      title,
      message,
      link,
      isRead: false,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createNotificationHelper
};
