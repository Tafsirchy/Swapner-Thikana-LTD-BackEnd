const express = require('express');
const router = express.Router();

const leadController = require('../controllers/lead.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// @route   POST /api/leads
// @desc    Submit a new inquiry
// @access  Public
router.post('/', leadController.createLead);

// @route   GET /api/leads/my-inquiries
// @desc    Get my inquiries
// @access  Private
router.get('/my-inquiries', protect, leadController.getMyInquiries);

// @route   GET /api/leads
// @desc    Get all leads
// @access  Private
router.get('/', protect, authorize('agent', 'admin'), leadController.getLeads);

// @route   PATCH /api/leads/:id/status
// @desc    Update lead status
// @access  Private
router.patch('/:id/status', protect, authorize('agent', 'admin'), leadController.updateLeadStatus);

module.exports = router;
