const { body } = require('express-validator');

const createBlogValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 50 }).withMessage('Content must be at least 50 characters'),
    

  
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
    
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
    
  // Prevent mass assignment
  body('slug').not().exists().withMessage('Cannot set slug manually'),
  body('author').not().exists().withMessage('Cannot set author manually'),
  body('views').not().exists().withMessage('Cannot set views manually'),
  body('readingTime').not().exists().withMessage('Cannot set readingTime manually'),
];

const updateBlogValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 50 }).withMessage('Content must be at least 50 characters'),
    
  // Prevent mass assignment
  body('slug').not().exists().withMessage('Cannot update slug manually'),
  body('author').not().exists().withMessage('Cannot update author manually'),
  body('views').not().exists().withMessage('Cannot update views manually'),
];

module.exports = {
  createBlogValidator,
  updateBlogValidator
};
