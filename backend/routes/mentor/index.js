const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const profileRoutes = require('./profile');
const dashboardRoutes = require('./dashboard');
const sessionRoutes = require('./sessions');

// Security middleware
router.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for mentor routes
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://mentorverse.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

router.use(cors(corsOptions));

// General rate limiting for mentor API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(generalLimiter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mentor API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Mentor API Documentation',
    version: '1.0.0',
    endpoints: {
      authentication: {
        'POST /auth/register': 'Register a new mentor',
        'POST /auth/login': 'Login mentor',
        'POST /auth/logout': 'Logout mentor',
        'GET /auth/me': 'Get current mentor info',
        'POST /auth/forgot-password': 'Request password reset',
        'PUT /auth/change-password': 'Change mentor password'
      },
      profile: {
        'GET /profile': 'Get mentor profile',
        'POST /profile': 'Create mentor profile',
        'PUT /profile': 'Update mentor profile',
        'DELETE /profile': 'Deactivate mentor profile',
        'GET /profile/check': 'Check profile completeness',
        'PUT /profile/availability': 'Update availability'
      },
      dashboard: {
        'GET /dashboard/stats': 'Get dashboard statistics',
        'GET /dashboard/sessions': 'Get sessions with filtering',
        'GET /dashboard/earnings': 'Get earnings data',
        'GET /dashboard/analytics': 'Get analytics data',
        'GET /dashboard/recent-activity': 'Get recent activity'
      },
      sessions: {
        'GET /sessions': 'Get mentor sessions',
        'POST /sessions': 'Create new session',
        'GET /sessions/:id': 'Get session details',
        'PUT /sessions/:id': 'Update session',
        'DELETE /sessions/:id': 'Cancel session',
        'POST /sessions/:id/feedback': 'Add session feedback'
      }
    },
    database: 'Separate mentor database',
    authentication: 'JWT with Bearer token',
    rateLimit: '100 requests per 15 minutes'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/sessions', sessionRoutes);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Mentor API Error:', error);

  // CORS error
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // MongoDB connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler for mentor routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Mentor API endpoint not found',
    availableEndpoints: [
      '/mentor/health',
      '/mentor/docs',
      '/mentor/auth/*',
      '/mentor/profile/*',
      '/mentor/dashboard/*',
      '/mentor/sessions/*'
    ]
  });
});

module.exports = router;