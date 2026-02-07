const express = require('express');
const router = express.Router();

const regionController = require('../controllers/region.controller');
const regionProjectController = require('../controllers/regionProject.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// @route   GET /api/regions
// @desc    Get all regions with project counts
router.get('/regions', regionController.getAllRegions);

// @route   GET /api/regions/:regionId/projects
// @desc    Get projects for a specific region
router.get('/regions/:regionId/projects', regionProjectController.getRegionProjects);

// @route   GET /api/master-plan/projects
// @desc    Get all projects across all regions
router.get('/master-plan/projects', regionProjectController.getAllMasterPlanProjects);

// @route   POST /api/admin/region-projects
// @desc    Link a project to a region
router.post('/admin/region-projects', protect, authorize('admin', 'management'), regionProjectController.linkProjectToRegion);

// @route   GET /api/admin/region-projects
// @desc    Get all project-region links
router.get('/admin/region-projects', protect, authorize('admin', 'management'), regionProjectController.getRegionProjectLinks);

// @route   PUT /api/admin/region-projects/:id
// @desc    Update project-region link (displayOrder or isFeatured)
router.put('/admin/region-projects/:id', protect, authorize('admin', 'management'), regionProjectController.updateRegionProjectLink);

// @route   DELETE /api/admin/region-projects/:id
// @desc    Delete project-region link
router.delete('/admin/region-projects/:id', protect, authorize('admin', 'management'), regionProjectController.deleteRegionProjectLink);

// @route   PUT /api/admin/regions/:regionId
// @desc    Update region image and/or description
router.put('/admin/regions/:regionId', protect, authorize('admin', 'management'), regionController.updateRegion);

module.exports = router;
