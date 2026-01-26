const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({ message: 'Get all projects - To be implemented in Phase 3' });
});

router.get('/featured', (req, res) => {
  res.status(501).json({ message: 'Get featured projects - To be implemented in Phase 3' });
});

router.get('/:slug', (req, res) => {
  res.status(501).json({ message: 'Get project by slug - To be implemented in Phase 3' });
});

module.exports = router;
