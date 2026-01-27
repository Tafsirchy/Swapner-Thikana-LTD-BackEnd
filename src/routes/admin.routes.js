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
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Property Management
router.get('/properties', getAllProperties);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', rejectProperty);
router.put('/properties/:id/feature', toggleFeatured);

// Email Templates
router.get('/email-templates', getEmailTemplates);
router.get('/email-preview/:type', getEmailPreview);

module.exports = router;
