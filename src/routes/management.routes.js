const express = require('express');
const router = express.Router();
const { 
  getAllManagement, 
  getManagementById, 
  createManagement, 
  updateManagement, 
  deleteManagement 
} = require('../controllers/management.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Public routes
router.get('/', getAllManagement);

// Protected routes (Admin & Management)
router.use(protect);
router.use(authorize('admin', 'management'));

router.get('/:id', getManagementById);
router.post('/', createManagement);
router.put('/:id', updateManagement);
router.delete('/:id', deleteManagement);

module.exports = router;
