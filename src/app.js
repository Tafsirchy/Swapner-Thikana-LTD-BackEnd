const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit =require('express-rate-limit');

const app = express();

// Security middleware (configured to allow CORS)
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS - Robust Manual Implementation
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Reflection logic for credentials support
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Auth-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Logging
const morgan = require('morgan');
app.use(morgan('dev'));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const { apiLimiter, authLimiter } = require('./middlewares/rateLimiter');
app.use('/api/', apiLimiter);
// authLimiter removed as per user request

// Health check endpoint
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/properties', require('./routes/property.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/leads', require('./routes/lead.routes'));
app.use('/api/blogs', require('./routes/blog.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/saved-searches', require('./routes/savedSearch.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/reminders', require('./routes/reminder.routes'));
app.use('/api/wishlists', require('./routes/wishlist.routes'));

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;
