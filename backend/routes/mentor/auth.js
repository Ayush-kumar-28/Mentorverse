const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { MentorUser } = require('../../models/mentor');
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
    { id: userId, type: 'mentor' },
    process.env.JWT_SECRET || 'mentor_jwt_secret_key',
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
 * @route   POST /api/mentor/auth/register
 * @desc    Register a new mentor
 * @access  Public
 */
router.post('/register', authLimiter, registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if mentor already exists
    const existingMentor = await MentorUser.findOne({ email });
    if (existingMentor) {
      return res.status(409).json({
        success: false,
        message: 'A mentor with this email already exists'
      });
    }

    // Create new mentor
    const mentor = new MentorUser({
      name: name.trim(),
      email: email.toLowerCase(),
      password
    });

    await mentor.save();

    // Generate token
    const token = generateToken(mentor._id);

    // Remove password from response
    const mentorResponse = mentor.toObject();
    delete mentorResponse.password;
    delete mentorResponse.loginAttempts;
    delete mentorResponse.lockUntil;

    res.status(201).json({
      success: true,
      message: 'Mentor registered successfully',
      token,
      mentor: mentorResponse
    });

  } catch (error) {
    console.error('Mentor registration error:', error);
    
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
 * @route   POST /api/mentor/auth/login
 * @desc    Login mentor
 * @access  Public
 */
router.post('/login', loginLimiter, loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find mentor by email
    const mentor = await MentorUser.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!mentor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (mentor.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Verify password
    const isPasswordValid = await mentor.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await mentor.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    if (mentor.loginAttempts > 0) {
      await mentor.resetLoginAttempts();
    }

    // Update last login
    mentor.lastLogin = new Date();
    await mentor.save();

    // Generate token
    const token = generateToken(mentor._id);

    // Remove sensitive data from response
    const mentorResponse = mentor.toObject();
    delete mentorResponse.password;
    delete mentorResponse.loginAttempts;
    delete mentorResponse.lockUntil;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      mentor: mentorResponse
    });

  } catch (error) {
    console.error('Mentor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

/**
 * @route   POST /api/mentor/auth/logout
 * @desc    Logout mentor (client-side token removal)
 * @access  Private
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * @route   GET /api/mentor/auth/me
 * @desc    Get current mentor info
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mentor_jwt_secret_key');
    
    if (decoded.type !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const mentor = await MentorUser.findById(decoded.id).select('-password -loginAttempts -lockUntil');
    
    if (!mentor || !mentor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    res.json({
      success: true,
      mentor
    });

  } catch (error) {
    console.error('Get mentor info error:', error);
    
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
 * @route   POST /api/mentor/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    const mentor = await MentorUser.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

    // TODO: Implement actual email sending logic here
    if (mentor) {
      console.log(`Password reset requested for mentor: ${mentor.email}`);
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
 * @route   PUT /api/mentor/auth/change-password
 * @desc    Change mentor password
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mentor_jwt_secret_key');
    const { currentPassword, newPassword } = req.body;

    const mentor = await MentorUser.findById(decoded.id);
    
    if (!mentor || !mentor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await mentor.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    mentor.password = newPassword;
    await mentor.save();

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
 * POST /api/mentor/auth/migrate
 * Migrate a user from main database to mentor database
 * Used when a mentor from main auth wants to create a mentor profile
 */
router.post('/migrate', async (req, res) => {
  try {
    const { name, email, mainUserId } = req.body;

    if (!name || !email || !mainUserId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and main user ID are required'
      });
    }

    // Check if mentor already exists in mentor database
    const existingMentor = await MentorUser.findOne({ email: email.toLowerCase() });
    if (existingMentor) {
      // Generate token for existing mentor
      const token = generateToken(existingMentor._id);
      return res.json({
        success: true,
        message: 'Mentor already exists in mentor database',
        token,
        mentor: {
          id: existingMentor._id,
          name: existingMentor.name,
          email: existingMentor.email,
          role: existingMentor.role,
          isActive: existingMentor.isActive,
          createdAt: existingMentor.createdAt
        }
      });
    }

    // Create new mentor user in mentor database
    const mentorUser = new MentorUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: 'migrated_user_' + Date.now(), // Temporary password
      role: 'mentor',
      isActive: true,
      isEmailVerified: true, // Assume verified since they came from main system
      mainUserId: mainUserId, // Reference to main database user
      migratedAt: new Date()
    });

    await mentorUser.save();

    // Generate JWT token
    const token = generateToken(mentorUser._id);

    res.status(201).json({
      success: true,
      message: 'Mentor successfully migrated to mentor database',
      token,
      mentor: {
        id: mentorUser._id,
        name: mentorUser.name,
        email: mentorUser.email,
        role: mentorUser.role,
        isActive: mentorUser.isActive,
        createdAt: mentorUser.createdAt
      }
    });

  } catch (error) {
    console.error('Mentor migration error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Mentor with this email already exists in mentor database'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to migrate mentor to mentor database',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;