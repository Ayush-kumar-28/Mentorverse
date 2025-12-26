const jwt = require('jsonwebtoken');
const { MentorUser, MentorProfile } = require('../models/mentor');

/**
 * Middleware to authenticate mentor requests
 * Verifies JWT token and ensures user is a mentor
 */
const mentorAuthMiddleware = async (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mentor_jwt_secret_key');

    // Check if token is for mentor
    if (decoded.type !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Mentor token required.'
      });
    }

    // Find mentor user
    const mentor = await MentorUser.findById(decoded.id).select('-password -loginAttempts -lockUntil');

    if (!mentor) {
      return res.status(401).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Check if mentor account is active
    if (!mentor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Mentor account is deactivated'
      });
    }

    // Check if account is locked
    if (mentor.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Mentor account is temporarily locked'
      });
    }

    // Add mentor to request object
    req.mentor = {
      id: mentor._id,
      name: mentor.name,
      email: mentor.email,
      avatar: mentor.avatar,
      role: mentor.role,
      isActive: mentor.isActive,
      isEmailVerified: mentor.isEmailVerified,
      lastLogin: mentor.lastLogin,
      createdAt: mentor.createdAt
    };

    next();

  } catch (error) {
    console.error('Mentor auth middleware error:', error);

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
const optionalMentorAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mentor_jwt_secret_key');

    if (decoded.type !== 'mentor') {
      return next();
    }

    const mentor = await MentorUser.findById(decoded.id).select('-password -loginAttempts -lockUntil');

    if (mentor && mentor.isActive && !mentor.isLocked) {
      req.mentor = {
        id: mentor._id,
        name: mentor.name,
        email: mentor.email,
        avatar: mentor.avatar,
        role: mentor.role,
        isActive: mentor.isActive,
        isEmailVerified: mentor.isEmailVerified,
        lastLogin: mentor.lastLogin,
        createdAt: mentor.createdAt
      };
    }

    next();

  } catch (error) {
    // Silently continue if optional auth fails
    next();
  }
};

/**
 * Middleware to check if mentor profile is complete
 * Should be used after mentorAuthMiddleware
 */
const requireCompleteProfile = async (req, res, next) => {
  try {
    if (!req.mentor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const mentorProfile = await MentorProfile.findOne({ userId: req.mentor.id });

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found. Please complete your profile setup.'
      });
    }

    if (!mentorProfile.isProfileComplete) {
      return res.status(403).json({
        success: false,
        message: 'Profile incomplete. Please complete your profile to access this feature.',
        completionPercentage: mentorProfile.completionPercentage
      });
    }

    req.mentorProfile = mentorProfile;
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
 * Middleware to check if mentor is verified
 * Should be used after mentorAuthMiddleware
 */
const requireVerifiedMentor = async (req, res, next) => {
  try {
    if (!req.mentor) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const mentorProfile = await MentorProfile.findOne({ userId: req.mentor.id });

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    if (!mentorProfile.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Mentor verification required. Please contact support to verify your account.'
      });
    }

    req.mentorProfile = mentorProfile;
    next();

  } catch (error) {
    console.error('Mentor verification check error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification check error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  mentorAuthMiddleware,
  optionalMentorAuth,
  requireCompleteProfile,
  requireVerifiedMentor
};