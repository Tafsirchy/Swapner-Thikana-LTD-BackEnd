const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getAllProperties,
  approveProperty,
  rejectProperty,
  toggleFeatured
} = require('../controllers/admin.controller');
const {
  getEmailPreview,
  getEmailTemplates
} = require('../controllers/emailPreview.controller');

// All routes require authentication and admin role
router.use(protect);
// Dashboard (Admin & Management)
router.get('/dashboard', authorize('admin', 'management'), getDashboardStats);

// User Management (Admin & Management view, Admin only write)
router.get('/users', authorize('admin', 'management'), getAllUsers);
router.put('/users/:id/role', authorize('admin'), updateUserRole);
router.put('/users/:id/status', authorize('admin'), updateUserStatus);
router.delete('/users/:id', authorize('admin'), deleteUser);

// Property Management (Admin & Management)
router.get('/properties', authorize('admin', 'management'), getAllProperties);
router.put('/properties/:id/approve', authorize('admin', 'management'), approveProperty);
router.put('/properties/:id/reject', authorize('admin', 'management'), rejectProperty);
router.put('/properties/:id/feature', authorize('admin', 'management'), toggleFeatured);

// Email Templates
router.get('/email-templates', authorize('admin', 'management'), getEmailTemplates);
router.get('/email-preview/:type', authorize('admin', 'management'), getEmailPreview);

module.exports = router;
