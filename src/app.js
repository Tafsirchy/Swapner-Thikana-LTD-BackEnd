const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit =require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());

// Initialize Passport
const passport = require('passport');
require('./config/passport'); // Load passport configuration
app.use(passport.initialize());

// DEBUG: Request Inspector
app.use((req, res, next) => {
  if (req.url.includes('/api/auth') || req.url.includes('/api/notifications')) {
    console.log(`\n[DEBUG] Request: ${req.method} ${req.url}`);
    console.log(`[DEBUG] Origin: ${req.headers.origin}`);
    console.log(`[DEBUG] Cookie Header: ${req.headers.cookie ? 'Present' : 'Missing'}`);
    if (req.headers.cookie) {
      console.log(`[DEBUG] Cookies keys: ${Object.keys(req.cookies || {}).join(', ')}`);
    }
  }
  next();
});

// Security middleware (configured to allow CORS)
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    // In development, allow any origin. In production, be more strict.
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Auth-Token'],
}));

// Body parser (Must be before routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
const morgan = require('morgan');
app.use(morgan('dev'));

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
app.use('/api/public', require('./routes/public.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/properties', require('./routes/property.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api', require('./routes/region.routes'));
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
app.use('/api/magazines', require('./routes/magazine.routes'));
app.use('/api/agencies', require('./routes/agency.routes'));
app.use('/api/management', require('./routes/management.routes'));
app.use('/api/agents', require('./routes/agent.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/seller', require('./routes/seller.routes'));
app.use('/api/history', require('./routes/history.routes'));

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
