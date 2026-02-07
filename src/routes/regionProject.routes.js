const express = require('express');
const router = express.Router();

const regionProjectController = require('../controllers/regionProject.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// @route   GET /api/regions/:regionId/projects
// @desc    Get projects for a specific region
// @access  Public
router.get('/regions/:regionId/projects', regionProjectController.getRegionProjects);

// @route   GET /api/master-plan/projects
// @desc    Get all projects across all regions
// @access  Public
router.get('/master-plan/projects', regionProjectController.getAllMasterPlanProjects);

// @route   POST /api/admin/region-projects
// @desc    Link a project to a region
// @access  Private/Admin
router.post('/admin/region-projects', protect, authorize('admin', 'management'), regionProjectController.linkProjectToRegion);

// @route   GET /api/admin/region-projects
// @desc    Get all project-region links
// @access  Private/Admin
router.get('/admin/region-projects', protect, authorize('admin', 'management'), regionProjectController.getRegionProjectLinks);

// @route   PUT /api/admin/region-projects/:id
// @desc    Update project-region link (displayOrder or isFeatured)
// @access  Private/Admin
router.put('/admin/region-projects/:id', protect, authorize('admin', 'management'), regionProjectController.updateRegionProjectLink);

// @route   DELETE /api/admin/region-projects/:id
// @desc    Delete project-region link
// @access  Private/Admin
router.delete('/admin/region-projects/:id', protect, authorize('admin', 'management'), regionProjectController.deleteRegionProjectLink);

module.exports = router;
