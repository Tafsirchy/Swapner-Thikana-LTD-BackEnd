const express = require('express');
const router = express.Router();

const regionController = require('../controllers/region.controller');
const regionProjectController = require('../controllers/regionProject.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// @route   GET /api/regions
// @desc    Get all regions with project counts
router.get('/', regionController.getAllRegions);

// @route   GET /api/regions/:regionId/projects
// @desc    Get projects for a specific region
router.get('/:regionId/projects', regionProjectController.getRegionProjects);

// @route   PUT /api/admin/regions/:regionId
// @desc    Update region image and/or description
router.put('/admin/:regionId', protect, authorize('admin', 'management'), regionController.updateRegion);

module.exports = router;
