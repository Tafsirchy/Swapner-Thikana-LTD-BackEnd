const express = require('express');
const router = express.Router();
const agencyController = require('../controllers/agency.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Public routes
router.get('/', agencyController.getAgencies);
router.get('/id/:id', agencyController.getAgencyById);
router.get('/:slug', agencyController.getAgencyBySlug);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin', 'management'), agencyController.createAgency);
router.put('/:id', protect, authorize('admin', 'management'), agencyController.updateAgency);
router.delete('/:id', protect, authorize('admin', 'management'), agencyController.deleteAgency);


module.exports = router;
