const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { MenteeUser } = require('../../models/mentee');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
});

// Validation middleware
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'mentee' },
    process.env.JWT_SECRET || 'mentee_jwt_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }))
    });
  }
  next();
};

/**
 * @route   POST /api/mentee/auth/register
 * @desc    Register a new mentee
 * @access  Public
 */
router.post('/register', authLimiter, registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if mentee already exists
    const existingMentee = await MenteeUser.findOne({ email });
    if (existingMentee) {
      return res.status(409).json({
        success: false,
        message: 'A mentee with this email already exists'
      });
    }

    // Create new mentee
    const mentee = new MenteeUser({
      name: name.trim(),
      email: email.toLowerCase(),
      password
    });

    await mentee.save();

    // Generate token
    const token = generateToken(mentee._id);

    // Remove password from response
    const menteeResponse = mentee.toObject();
    delete menteeResponse.password;
    delete menteeResponse.loginAttempts;
    delete menteeResponse.lockUntil;

    res.status(201).json({
      success: true,
      message: 'Mentee registered successfully',
      token,
      mentee: menteeResponse,
      nextStep: 'onboarding'
    });

  } catch (error) {
    console.error('Mentee registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

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

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

/**
 * @route   POST /api/mentee/auth/login
 * @desc    Login mentee
 * @access  Public
 */
router.post('/login', loginLimiter, loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find mentee by email
    const mentee = await MenteeUser.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!mentee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (mentee.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Verify password
    const isPasswordValid = await mentee.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await mentee.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    if (mentee.loginAttempts > 0) {
      await mentee.resetLoginAttempts();
    }

    // Update last login
    mentee.lastLogin = new Date();
    await mentee.save();

    // Generate token
    const token = generateToken(mentee._id);

    // Remove sensitive data from response
    const menteeResponse = mentee.toObject();
    delete menteeResponse.password;
    delete menteeResponse.loginAttempts;
    delete menteeResponse.lockUntil;

    // Determine next step based on onboarding status
    let nextStep = 'dashboard';
    if (!mentee.onboardingCompleted) {
      nextStep = 'onboarding';
    } else if (!mentee.isEmailVerified) {
      nextStep = 'verify-email';
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      mentee: menteeResponse,
      nextStep
    });

  } catch (error) {
    console.error('Mentee login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

/**
 * @route   POST /api/mentee/auth/logout
 * @desc    Logout mentee (client-side token removal)
 * @access  Private
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * @route   GET /api/mentee/auth/me
 * @desc    Get current mentee info
 * @access  Private
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mentee_jwt_secret_key');
    
    if (decoded.type !== 'mentee') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const mentee = await MenteeUser.findById(decoded.id).select('-password -loginAttempts -lockUntil');
    
    if (!mentee || !mentee.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentee not found'
      });
    }

    res.json({
      success: true,
      mentee
    });

  } catch (error) {
    console.error('Get mentee info error:', error);
    
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

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/mentee/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    const mentee = await MenteeUser.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

    // TODO: Implement actual email sending logic here
    if (mentee) {
      const resetToken = mentee.generatePasswordResetToken();
      await mentee.save();
      console.log(`Password reset requested for mentee: ${mentee.email}, token: ${resetToken}`);
      // Generate reset token and send email
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/mentee/auth/change-password
 * @desc    Change mentee password
 * @access  Private
 */
router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
], handleValidationErrors, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mentee_jwt_secret_key');
    const { currentPassword, newPassword } = req.body;

    const mentee = await MenteeUser.findById(decoded.id);
    
    if (!mentee || !mentee.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentee not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await mentee.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    mentee.password = newPassword;
    await mentee.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/mentee/auth/verify-email
 * @desc    Verify email address
 * @access  Private
 */
router.post('/verify-email', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mentee_jwt_secret_key');
    const { verificationToken } = req.body;

    const mentee = await MenteeUser.findById(decoded.id);
    
    if (!mentee) {
      return res.status(404).json({
        success: false,
        message: 'Mentee not found'
      });
    }

    if (mentee.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    if (!mentee.emailVerificationToken || mentee.emailVerificationToken !== verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    if (mentee.emailVerificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired'
      });
    }

    // Mark email as verified
    mentee.isEmailVerified = true;
    mentee.emailVerificationToken = null;
    mentee.emailVerificationExpires = null;
    await mentee.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/mentee/auth/resend-verification
 * @desc    Resend email verification
 * @access  Private
 */
router.post('/resend-verification', authLimiter, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mentee_jwt_secret_key');
    const mentee = await MenteeUser.findById(decoded.id);
    
    if (!mentee) {
      return res.status(404).json({
        success: false,
        message: 'Mentee not found'
      });
    }

    if (mentee.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = mentee.generateEmailVerificationToken();
    await mentee.save();

    // TODO: Send verification email
    console.log(`Email verification token for ${mentee.email}: ${verificationToken}`);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;