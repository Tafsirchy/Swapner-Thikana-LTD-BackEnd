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

// Security middleware (configured to allow CORS)
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    // Strict Whitelist
    const allowedOrigins = [
      process.env.FRONTEND_URL,              // Production Frontend
      'https://shwapner-thikana.vercel.app', // Vercel Preview/Prod
      'https://www.shwapnerthikana.com',     // Custom Domain
      'https://shwapnerthikana.com',         // Custom Domain (non-www)
      'https://real-estate-frontend-sand.vercel.app', // Production UI
    ];

    // Add localhost only in development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
      allowedOrigins.push('http://localhost:3001');
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      const corsError = new Error('Not allowed by CORS');
      corsError.statusCode = 403;
      callback(corsError);
    }
  },
  credentials: true, // Required for cookies
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
const { apiLimiter } = require('./middlewares/rateLimit.middleware');
app.use('/api', apiLimiter);

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
const apiRouter = express.Router();

// Route modules
const regionRoutes = require('./routes/region.routes');
const masterPlanRoutes = require('./routes/masterPlan.routes');

// Register all routes on the apiRouter
apiRouter.use('/regions', regionRoutes);
apiRouter.use('/master-plan', masterPlanRoutes);
apiRouter.use('/public', require('./routes/public.routes'));
apiRouter.use('/auth', require('./routes/auth.routes'));
apiRouter.use('/properties', require('./routes/property.routes'));
apiRouter.use('/projects', require('./routes/project.routes'));
apiRouter.use('/leads', require('./routes/lead.routes'));
apiRouter.use('/blogs', require('./routes/blog.routes'));
apiRouter.use('/users', require('./routes/user.routes'));
apiRouter.use('/admin', require('./routes/admin.routes'));
apiRouter.use('/saved-searches', require('./routes/savedSearch.routes'));
apiRouter.use('/notifications', require('./routes/notification.routes'));
apiRouter.use('/reviews', require('./routes/review.routes'));
apiRouter.use('/analytics', require('./routes/analytics.routes'));
apiRouter.use('/reminders', require('./routes/reminder.routes'));
apiRouter.use('/wishlists', require('./routes/wishlist.routes'));
apiRouter.use('/magazines', require('./routes/magazine.routes'));
apiRouter.use('/agencies', require('./routes/agency.routes'));
apiRouter.use('/management', require('./routes/management.routes'));
apiRouter.use('/agents', require('./routes/agent.routes'));
apiRouter.use('/upload', require('./routes/upload.routes'));
apiRouter.use('/seller', require('./routes/seller.routes'));
apiRouter.use('/history', require('./routes/history.routes'));
apiRouter.use('/newsletter', require('./routes/newsletter.routes'));

// Mount on /api
app.use('/api', apiRouter);

// Fallback for root (only matches if /api didn't)
app.use('/', apiRouter);

// 404 handler - must be after all routes
app.use((req, res) => {
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    url: req.url,
    fullUrl: fullUrl
  });
});

// Error handling middleware
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;
