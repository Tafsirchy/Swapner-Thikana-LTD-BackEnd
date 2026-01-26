const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({ message: 'Get all users - To be implemented' });
});

router.get('/profile', (req, res) => {
  res.status(501).json({ message: 'Get user profile - To be implemented in Phase 5' });
});

router.put('/profile', (req, res) => {
  res.status(501).json({ message: 'Update profile - To be implemented in Phase 5' });
});

router.put('/password', (req, res) => {
  res.status(501).json({ message: 'Change password - To be implemented in Phase 5' });
});

router.get('/saved-properties', (req, res) => {
  res.status(501).json({ message: 'Get saved properties - To be implemented in Phase 6' });
});

router.post('/saved-properties/:id', (req, res) => {
  res.status(501).json({ message: 'Save property - To be implemented in Phase 6' });
});

router.delete('/saved-properties/:id', (req, res) => {
  res.status(501).json({ message: 'Unsave property - To be implemented in Phase 6' });
});

module.exports = router;
