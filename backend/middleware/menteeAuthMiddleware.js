const jwt = require('jsonwebtoken');
const { MenteeUser, MenteeProfile } = require('../models/mentee');

/**
 * Middleware to authenticate mentee requests
 * Verifies JWT token and ensures user is a mentee
 */
const menteeAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided'
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use Bearer token.'
      });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mentee_jwt_secret_key');

    // Check if token is for mentee
    if (decoded.type !== 'mentee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Mentee token required.'
      });
    }

    // Find mentee user
    const mentee = await MenteeUser.findById(decoded.id).select('-password -loginAttempts -lockUntil');

    if (!mentee) {
      return res.status(401).json({
        success: false,
        message: 'Mentee not found'
      });
    }

    // Check if mentee account is active
    if (!mentee.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Mentee account is deactivated'
      });
    }

    // Check if account is locked
    if (mentee.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Mentee account is temporarily locked'
      });
    }

    // Add mentee to request object
    req.mentee = {
      id: mentee._id,
      name: mentee.name,
      email: mentee.email,
      avatar: mentee.avatar,
      role: mentee.role,
      isActive: mentee.isActive,
      isEmailVerified: mentee.isEmailVerified,
      lastLogin: mentee.lastLogin,
      onboardingCompleted: mentee.onboardingCompleted,
      onboardingStep: mentee.onboardingStep,
      preferences: mentee.preferences,
      createdAt: mentee.createdAt
    };

    next();

  } catch (error) {
    console.error('Mentee auth middleware error:', error);

    // Handle specific JWT errors
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

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not active yet'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Optional middleware - doesn't fail if no token provided
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
const optionalMenteeAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mentee_jwt_secret_key');

    if (decoded.type !== 'mentee') {
      return next();
    }

    const mentee = await MenteeUser.findById(decoded.id).select('-password -loginAttempts -lockUntil');

    if (mentee && mentee.isActive && !mentee.isLocked) {
      req.mentee = {
        id: mentee._id,
        name: mentee.name,
        email: mentee.email,
        avatar: mentee.avatar,
        role: mentee.role,
        isActive: mentee.isActive,
        isEmailVerified: mentee.isEmailVerified,
        lastLogin: mentee.lastLogin,
        onboardingCompleted: mentee.onboardingCompleted,
        onboardingStep: mentee.onboardingStep,
        preferences: mentee.preferences,
        createdAt: mentee.createdAt
      };
    }

    next();

  } catch (error) {
    // Silently continue if optional auth fails
    next();
  }
};

/**
 * Middleware to check if mentee profile is complete
 * Should be used after menteeAuthMiddleware
 */
const requireCompleteProfile = async (req, res, next) => {
  try {
    if (!req.mentee) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const menteeProfile = await MenteeProfile.findOne({ userId: req.mentee.id });

    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentee profile not found. Please complete your profile setup.',
        redirectTo: '/profile/setup'
      });
    }

    if (!menteeProfile.isProfileComplete) {
      return res.status(403).json({
        success: false,
        message: 'Profile incomplete. Please complete your profile to access this feature.',
        completionPercentage: menteeProfile.completionPercentage,
        redirectTo: '/profile/complete'
      });
    }

    req.menteeProfile = menteeProfile;
    next();

  } catch (error) {
    console.error('Profile completeness check error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile verification error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Middleware to check if mentee has completed onboarding
 * Should be used after menteeAuthMiddleware
 */
const requireOnboardingComplete = async (req, res, next) => {
  try {
    if (!req.mentee) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.mentee.onboardingCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Onboarding not completed. Please complete the onboarding process.',
        currentStep: req.mentee.onboardingStep,
        redirectTo: '/onboarding'
      });
    }

    next();

  } catch (error) {
    console.error('Onboarding check error:', error);
    res.status(500).json({
      success: false,
      message: 'Onboarding verification error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Middleware to check if mentee email is verified
 * Should be used after menteeAuthMiddleware
 */
const requireEmailVerified = async (req, res, next) => {
  try {
    if (!req.mentee) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.mentee.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required. Please verify your email address.',
        redirectTo: '/verify-email'
      });
    }

    next();

  } catch (error) {
    console.error('Email verification check error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification check error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Middleware to validate session ownership
 * Ensures mentee can only access their own sessions
 */
const validateSessionOwnership = async (req, res, next) => {
  try {
    if (!req.mentee) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const sessionId = req.params.sessionId || req.params.id;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const { MenteeSession } = require('../models/mentee');
    const session = await MenteeSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if the session belongs to the authenticated mentee
    if (session.menteeId.toString() !== req.mentee.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own sessions.'
      });
    }

    req.session = session;
    next();

  } catch (error) {
    console.error('Session ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Session validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  menteeAuthMiddleware,
  optionalMenteeAuth,
  requireCompleteProfile,
  requireOnboardingComplete,
  requireEmailVerified,
  validateSessionOwnership
};