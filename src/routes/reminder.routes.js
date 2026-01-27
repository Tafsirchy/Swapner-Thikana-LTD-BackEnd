const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.route('/')
  .post(reminderController.createReminder)
  .get(reminderController.getReminders);

router.route('/:id')
  .delete(reminderController.deleteReminder);

router.patch('/:id/complete', reminderController.toggleReminderComplete);

module.exports = router;
