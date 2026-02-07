const express = require('express');
const router = express.Router();

const regionProjectController = require('../controllers/regionProject.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// @route   GET /api/master-plan/projects
// @desc    Get all projects across all regions
router.get('/projects', regionProjectController.getAllMasterPlanProjects);

// @route   GET /api/master-plan/admin/region-projects
// @desc    Get all project-region links
router.get('/admin/region-projects', protect, authorize('admin', 'management'), regionProjectController.getRegionProjectLinks);

// @route   POST /api/master-plan/admin/region-projects
// @desc    Link a project to a region
router.post('/admin/region-projects', protect, authorize('admin', 'management'), regionProjectController.linkProjectToRegion);

// @route   PUT /api/master-plan/admin/region-projects/:id
// @desc    Update project-region link
router.put('/admin/region-projects/:id', protect, authorize('admin', 'management'), regionProjectController.updateRegionProjectLink);

// @route   DELETE /api/master-plan/admin/region-projects/:id
// @desc    Delete project-region link
router.delete('/admin/region-projects/:id', protect, authorize('admin', 'management'), regionProjectController.deleteRegionProjectLink);

module.exports = router;
