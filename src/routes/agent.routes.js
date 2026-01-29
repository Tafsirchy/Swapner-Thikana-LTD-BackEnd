const express = require('express');
const router = express.Router();
const { 
  getAllAgents, 
  getAgentById, 
  createAgent, 
  updateAgent, 
  deleteAgent 
} = require('../controllers/agent.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Public routes
router.get('/', getAllAgents);

// Protected routes (Admin & Management)
router.use(protect);
router.use(authorize('admin', 'management'));

router.get('/:id', getAgentById);
router.post('/', createAgent);
router.put('/:id', updateAgent);
router.delete('/:id', deleteAgent);

module.exports = router;
