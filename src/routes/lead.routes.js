const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  getLead,
  updateLead,
  addNote,
} = require('../controllers/lead.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validation.middleware');

// Validation rules
const createLeadValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('leadType')
    .isIn(['property-inquiry', 'project-inquiry', 'contact-form', 'callback-request'])
    .withMessage('Invalid lead type'),
];

// Public routes
router.post('/', createLeadValidation, validate, createLead);

// Protected routes (Agent/Admin)
router.get('/', protect, authorize('agent', 'admin'), getLeads);
router.get('/:id', protect, authorize('agent', 'admin'), getLead);
router.put('/:id', protect, authorize('agent', 'admin'), updateLead);
router.post('/:id/notes', protect, authorize('agent', 'admin'), addNote);

module.exports = router;
