const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const { validate } = require('../middlewares/validation.middleware');
const { createBlogValidator, updateBlogValidator } = require('../validators/blog.validator');

// @route   GET /api/blogs
// @desc    Get all blogs
// @access  Public
router.get('/', blogController.getBlogs);

// @route   GET /api/blogs/id/:id
// @desc    Get blog by ID
// @access  Public
router.get('/id/:id', blogController.getBlogById);

// @route   GET /api/blogs/slug/:slug
// @desc    Get blog by slug
// @access  Public
router.get('/slug/:slug', blogController.getBlogBySlug);

const upload = require('../middlewares/upload.middleware');
const { imgbbUpload } = require('../middlewares/imgbb.middleware');

// @route   POST /api/blogs
// @desc    Create a blog
// @access  Private/Admin
router.post('/', protect, authorize('admin'), upload.single('image'), imgbbUpload, createBlogValidator, validate, blogController.createBlog);

// @route   PUT /api/blogs/:id
// @desc    Update a blog
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), upload.single('image'), imgbbUpload, updateBlogValidator, validate, blogController.updateBlog);

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), blogController.deleteBlog);

module.exports = router;
