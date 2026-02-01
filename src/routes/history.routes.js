const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Public route
router.get('/', historyController.getPublicHistory);

// Admin routes (Protected)
router.use(protect);
router.use(authorize('admin'));

router.get('/admin', historyController.getAllMilestones);
router.get('/:id', historyController.getMilestoneById);
router.post('/', historyController.createMilestone);
router.put('/:id', historyController.updateMilestone);
router.delete('/:id', historyController.deleteMilestone);

module.exports = router;
