const { Reminders } = require('../models/Reminder');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Create a new reminder
 * @route   POST /api/reminders
 * @access  Private
 */
const createReminder = async (req, res, next) => {
  try {
    const { leadId, title, note, dueDate } = req.body;

    if (!title || !dueDate) {
      return ApiResponse.error(res, 'Title and due date are required', 400);
    }

    const reminder = {
      user: new ObjectId(req.user._id),
      lead: leadId ? new ObjectId(leadId) : null,
      title,
      note: note || '',
      dueDate: new Date(dueDate),
      isCompleted: false,
      isSent: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Reminders().insertOne(reminder);
    reminder._id = result.insertedId;

    return ApiResponse.success(res, 'Reminder set successfully', { reminder }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's reminders
 * @route   GET /api/reminders
 * @access  Private
 */
const getReminders = async (req, res, next) => {
  try {
    const { upcoming = false } = req.query;
    const query = { user: new ObjectId(req.user._id) };

    if (upcoming === 'true') {
      query.dueDate = { $gte: new Date() };
      query.isCompleted = false;
    }

    const reminders = await Reminders()
      .find(query)
      .sort({ dueDate: 1 })
      .toArray();

    return ApiResponse.success(res, 'Reminders fetched', { reminders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark reminder as completed
 * @route   PATCH /api/reminders/:id/complete
 * @access  Private
 */
const toggleReminderComplete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;

    const result = await Reminders().findOneAndUpdate(
      { _id: new ObjectId(id), user: new ObjectId(req.user._id) },
      { $set: { isCompleted, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return ApiResponse.error(res, 'Reminder not found', 404);
    }

    return ApiResponse.success(res, 'Reminder updated', { reminder: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete reminder
 * @route   DELETE /api/reminders/:id
 * @access  Private
 */
const deleteReminder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await Reminders().deleteOne({
      _id: new ObjectId(id),
      user: new ObjectId(req.user._id)
    });

    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Reminder not found', 404);
    }

    return ApiResponse.success(res, 'Reminder deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReminder,
  getReminders,
  toggleReminderComplete,
  deleteReminder
};
