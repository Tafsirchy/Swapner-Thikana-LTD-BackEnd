const express = require('express');
const router = express.Router();

// Public - Submit inquiry
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Submit inquiry - To be implemented in Phase 3' });
});

// Protected - Get leads
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Get all leads - To be implemented in Phase 3' });
});

router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Get lead details - To be implemented in Phase 3' });
});

router.put('/:id/status', (req, res) => {
  res.status(501).json({ message: 'Update lead status - To be implemented in Phase 3' });
});

router.post('/:id/notes', (req, res) => {
  res.status(501).json({ message: 'Add note to lead - To be implemented in Phase 3' });
});

module.exports = router;
