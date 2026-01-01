const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const profileRoutes = require('./profile');
const dashboardRoutes = require('./dashboard');
const sessionRoutes = require('./sessions');

// Mount routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/sessions', sessionRoutes);

/**
 * @route   GET /api/mentee/health
 * @desc    Health check for mentee API
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mentee API is healthy',
    timestamp: new Date().toISOString(),
    database: 'mentorverse_mentees',
    version: '1.0.0'
  });
});

/**
 * @route   GET /api/mentee/docs
 * @desc    API documentation for mentee endpoints
 * @access  Public
 */
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Mentee API Documentation',
    version: '1.0.0',
    database: 'mentorverse_mentees',
    description: 'Comprehensive API for mentee users with separate database and enhanced features',
    endpoints: {
      authentication: {
        'POST /auth/register': 'Register a new mentee',
        'POST /auth/login': 'Login mentee',
        'POST /auth/logout': 'Logout mentee',
        'GET /auth/me': 'Get current mentee info',
        'POST /auth/forgot-password': 'Request password reset',
        'PUT /auth/change-password': 'Change password',
        'POST /auth/verify-email': 'Verify email address',
        'POST /auth/resend-verification': 'Resend email verification'
      },
      profile: {
        'GET /profile': 'Get mentee profile',
        'POST /profile': 'Create mentee profile',
        'PUT /profile': 'Update mentee profile',
        'DELETE /profile': 'Deactivate mentee profile',
        'GET /profile/check': 'Check profile completeness',
        'POST /profile/favorites/:mentorId': 'Add mentor to favorites',
        'DELETE /profile/favorites/:mentorId': 'Remove mentor from favorites'
      },
      dashboard: {
        'GET /dashboard/stats': 'Get comprehensive statistics',
        'GET /dashboard/sessions': 'Get sessions with filtering',
        'GET /dashboard/spending': 'Get spending data with trends',
        'GET /dashboard/analytics': 'Get advanced analytics',
        'GET /dashboard/recent-activity': 'Get recent activity feed',
        'GET /dashboard/recommendations': 'Get personalized mentor recommendations'
      },
      sessions: {
        'GET /sessions': 'Get mentee sessions (with filtering)',
        'POST /sessions': 'Book new session',
        'GET /sessions/upcoming': 'Get upcoming sessions',
        'GET /sessions/past': 'Get past sessions',
        'GET /sessions/:id': 'Get session details',
        'PUT /sessions/:id': 'Update session (limited fields)',
        'POST /sessions/:id/cancel': 'Cancel session',
        'POST /sessions/:id/reschedule': 'Request session reschedule',
        'POST /sessions/:id/feedback': 'Add mentee feedback',
        'POST /sessions/:id/complete-prework': 'Mark prework as completed'
      }
    },
    features: {
      authentication: [
        'JWT-based authentication',
        'Rate limiting',
        'Account locking',
        'Password policies',
        'Email verification',
        'Password reset'
      ],
      profile: [
        'Comprehensive profile management',
        'Skills and interests tracking',
        'Career goals management',
        'Learning path tracking',
        'Mentorship preferences',
        'Favorite mentors',
        'Profile completion tracking'
      ],
      dashboard: [
        'Session statistics',
        'Spending analytics',
        'Learning progress tracking',
        'Goal achievement metrics',
        'Mentor interaction analysis',
        'Personalized recommendations'
      ],
      sessions: [
        'Session booking and management',
        'Conflict detection',
        'Cancellation policies',
        'Rescheduling with limits',
        'Feedback and ratings',
        'Prework and homework tracking',
        'Session materials management'
      ]
    },
    security: {
      'Rate Limiting': 'Authentication endpoints limited',
      'Account Locking': '5 failed attempts locks account for 2 hours',
      'JWT Expiration': '7 days (configurable)',
      'Input Validation': 'All inputs validated and sanitized',
      'Session Ownership': 'Users can only access their own sessions'
    },
    database: {
      name: 'mentorverse_mentees',
      description: 'Separate database for mentee-specific features',
      collections: ['menteeusers', 'menteeprofiles', 'menteesessions']
    }
  });
});

module.exports = router;