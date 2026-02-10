const express = require('express');
const router = express.Router();

const leadController = require('../controllers/lead.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const { validate } = require('../middlewares/validation.middleware');
const { createLeadValidator, updateLeadStatusValidator } = require('../validators/lead.validator');

// @route   POST /api/leads
// @desc    Submit a new inquiry
// @access  Public
router.post('/', createLeadValidator, validate, leadController.createLead);

// @route   GET /api/leads/my-inquiries
// @desc    Get my inquiries
// @access  Private
router.get('/my-inquiries', protect, leadController.getMyInquiries);

// @route   GET /api/leads
// @desc    Get all leads
// @access  Private
router.get('/', protect, authorize('agent', 'admin', 'management'), leadController.getLeads);

router.patch('/:id/status', protect, authorize('admin', 'management'), updateLeadStatusValidator, validate, leadController.updateLeadStatus);


// @route   POST /api/leads/:id/notes
// @desc    Add a note to a lead
// @access  Private (Agent/Admin)
router.post('/:id/notes', protect, authorize('agent', 'admin', 'management'), leadController.addLeadNote);

// @route   PATCH /api/leads/:id/assign
// @desc    Assign lead to agent
// @access  Private (Admin/Management)
router.patch('/:id/assign', protect, authorize('admin', 'management'), leadController.assignLead);

// @route   DELETE /api/leads/:id
// @desc    Delete a lead
// @access  Private (Agent/Admin)
router.delete('/:id', protect, authorize('agent', 'admin', 'management'), leadController.deleteLead);

module.exports = router;
