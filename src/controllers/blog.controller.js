const { Blogs } = require('../models/Blog');
const ApiResponse = require('../utils/apiResponse');
const { generateUniqueSlug } = require('../utils/slugify');
const { ObjectId } = require('mongodb');

// Reading time helper
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const noOfWords = content.split(/\s/g).length;
  const minutes = noOfWords / wordsPerMinute;
  return Math.ceil(minutes);
};

/**
 * @desc    Get all blogs
 * @route   GET /api/blogs
 * @access  Public
 */
const getBlogs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      tag,
      search,
      status 
    } = req.query;

    const query = {};
    
    // Status handling for Admin vs Public
    if (status === 'draft') {
      query.isPublished = false;
    } else if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'all') {
      // No filter on isPublished
    } else {
      // Default public behavior
      query.isPublished = true;
    }
    
    if (category) query.category = category;
    if (tag) query.tags = tag;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const blogs = await Blogs()
      .aggregate([
        { $match: query },
        { $sort: { publishedAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorDetails'
          }
        },
        {
          $addFields: {
            authorName: { $arrayElemAt: ['$authorDetails.name', 0] }
          }
        },
        { $project: { authorDetails: 0 } }
      ])
      .toArray();

    const total = await Blogs().countDocuments(query);

    return ApiResponse.success(res, 'Blogs fetched', {
      blogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get blog by slug
 * @route   GET /api/blogs/slug/:slug
 * @access  Public
 */
const getBlogBySlug = async (req, res, next) => {
  try {
    const matchQuery = { $or: [{ slug: req.params.slug }] };
    
    if (ObjectId.isValid(req.params.slug)) {
      matchQuery.$or.push({ _id: new ObjectId(req.params.slug) });
    }

    const blogs = await Blogs().aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$authorDetails', 0] }
        }
      },
      { $project: { authorDetails: 0, 'author.password': 0 } }
    ]).toArray();

    const blog = blogs[0];

    if (!blog) {
      return ApiResponse.error(res, 'Article not found', 404);
    }

    // Increment views
    await Blogs().updateOne(
      { _id: blog._id },
      { $inc: { views: 1 } }
    );

    return ApiResponse.success(res, 'Article found', { blog });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get blog by ID
 * @route   GET /api/blogs/id/:id
 * @access  Public
 */
const getBlogById = async (req, res, next) => {
  try {
    const blog = await Blogs().findOne({ _id: new ObjectId(req.params.id) });

    if (!blog) {
      return ApiResponse.error(res, 'Article not found', 404);
    }

    return ApiResponse.success(res, 'Article found', { blog });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a blog
 * @route   POST /api/blogs
 * @access  Private/Admin
 */
const createBlog = async (req, res, next) => {
  try {
    const blogData = {
      ...req.body,
      slug: await generateUniqueSlug(req.body.title, Blogs()),
      author: new ObjectId(req.user._id),
      readingTime: calculateReadingTime(req.body.content),
      excerpt: req.body.excerpt || req.body.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: req.body.isPublished ? new Date() : null
    };

    const result = await Blogs().insertOne(blogData);
    const blog = { ...blogData, _id: result.insertedId };

    return ApiResponse.success(res, 'Article created successfully', { blog }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a blog
 * @route   PUT /api/blogs/:id
 * @access  Private/Admin
 */
const updateBlog = async (req, res, next) => {
  try {
    const blogId = new ObjectId(req.params.id);
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    if (req.body.content) {
      updateData.readingTime = calculateReadingTime(req.body.content);
    }

    if (req.body.isPublished && !req.body.publishedAt) {
      updateData.publishedAt = new Date();
    }

    delete updateData._id;
    delete updateData.slug;
    delete updateData.author;

    const result = await Blogs().updateOne(
      { _id: blogId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Article not found', 404);
    }

    const updatedBlog = await Blogs().findOne({ _id: blogId });

    return ApiResponse.success(res, 'Article updated successfully', { blog: updatedBlog });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a blog
 * @route   DELETE /api/blogs/:id
 * @access  Private/Admin
 */
const deleteBlog = async (req, res, next) => {
  try {
    const result = await Blogs().deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Article not found', 404);
    }

    return ApiResponse.success(res, 'Article deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog
};
