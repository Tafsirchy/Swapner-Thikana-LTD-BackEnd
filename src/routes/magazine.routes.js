const express = require('express');
const router = express.Router();
const magazineController = require('../controllers/magazine.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Public routes
router.get('/', magazineController.getMagazines);
router.get('/id/:id', magazineController.getMagazineById);
router.get('/:slug', magazineController.getMagazineBySlug);

const upload = require('../middlewares/upload.middleware');
const { imgbbUpload } = require('../middlewares/imgbb.middleware');

// Protected routes (Admin only)
router.post('/', protect, authorize('admin', 'management'), upload.single('image'), imgbbUpload, magazineController.createMagazine);
router.put('/:id', protect, authorize('admin', 'management'), upload.single('image'), imgbbUpload, magazineController.updateMagazine);
router.delete('/:id', protect, authorize('admin', 'management'), magazineController.deleteMagazine);


module.exports = router;
