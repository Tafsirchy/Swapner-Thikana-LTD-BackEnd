const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit =require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Logging
const morgan = require('morgan');
app.use(morgan('dev'));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
// Rate limiting
// const { apiLimiter, authLimiter } = require('./middlewares/rateLimiter');
// app.use('/api/', apiLimiter);
// app.use('/api/auth', authLimiter); // Stricter limit for auth routes

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
