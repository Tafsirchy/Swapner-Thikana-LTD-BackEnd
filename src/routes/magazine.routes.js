const express = require('express');
const router = express.Router();
const magazineController = require('../controllers/magazine.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Public routes
router.get('/', magazineController.getMagazines);
router.get('/id/:id', magazineController.getMagazineById);
router.get('/:slug', magazineController.getMagazineBySlug);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin', 'management'), magazineController.createMagazine);
router.put('/:id', protect, authorize('admin', 'management'), magazineController.updateMagazine);
router.delete('/:id', protect, authorize('admin', 'management'), magazineController.deleteMagazine);


module.exports = router;
