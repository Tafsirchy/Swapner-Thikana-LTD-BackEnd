const express = require('express');
const router = express.Router();

const projectController = require('../controllers/project.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const { validate } = require('../middlewares/validation.middleware');
const { createProjectValidator, updateProjectValidator } = require('../validators/project.validator');

// @route   GET /api/projects
// @desc    Get all projects
// @access  Public
router.get('/', projectController.getProjects);

// @route   GET /api/projects/id/:id
// @desc    Get project by ID
// @access  Public
router.get('/id/:id', projectController.getProjectById);

// @route   GET /api/projects/slug/:slug
// @desc    Get project by slug
// @access  Public
router.get('/slug/:slug', projectController.getProjectBySlug);

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'management'), createProjectValidator, validate, projectController.createProject);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'management'), updateProjectValidator, validate, projectController.updateProject);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'management'), projectController.deleteProject);

const upload = require('../middlewares/upload.middleware');
const { imgbbUpload } = require('../middlewares/imgbb.middleware');

// @route   POST /api/projects/:id/images
// @desc    Upload project images
// @access  Private/Admin
router.post('/:id/images', protect, authorize('admin', 'management'), upload.array('images', 20), imgbbUpload, projectController.uploadProjectImages);

module.exports = router;
