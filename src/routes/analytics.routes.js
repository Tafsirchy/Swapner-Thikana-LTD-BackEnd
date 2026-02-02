const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.use(protect);

// Admin Analytics
router.get('/admin', authorize('admin', 'management'), analyticsController.getAdminAnalytics);

// Agent Analytics
router.get('/agent', authorize('agent', 'admin', 'management'), analyticsController.getAgentAnalytics);

// Customer Analytics
router.get('/customer', analyticsController.getCustomerAnalytics);

module.exports = router;
