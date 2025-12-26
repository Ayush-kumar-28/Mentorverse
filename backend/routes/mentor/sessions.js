const express = require('express');
const { body, validationResult } = require('express-validator');
const { MentorSession, MentorProfile } = require('../../models/mentor');
const { mentorAuthMiddleware } = require('../../middleware/mentorAuthMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(mentorAuthMiddleware);

// Validation middleware
const sessionValidation = [
  body('menteeId')
    .notEmpty()
    .withMessage('Mentee ID is required'),
  body('menteeName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Mentee name must be between 2 and 100 characters'),
  body('menteeEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid mentee email is required'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Session title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Session description must be between 10 and 1000 characters'),
  body('scheduledStart')
    .isISO8601()
    .withMessage('Valid scheduled start date is required'),
  body('durationMinutes')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
];

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
 * @route   GET /api/mentor/sessions
 * @desc    Get mentor sessions with filtering and pagination
 * @access  Private (Mentor only)
 */
router.get('/', async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    
    // Get mentor profile
    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const sortBy = req.query.sortBy || 'scheduledStart';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const search = req.query.search;

    // Build filter
    const filter = { mentorId: mentorProfile._id };

    if (status && ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'].includes(status)) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.scheduledStart = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid startDate format'
          });
        }
        filter.scheduledStart.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid endDate format'
          });
        }
        filter.scheduledStart.$lte = end;
      }
    }

    if (search) {
      filter.$or = [
        { menteeName: { $regex: search, $options: 'i' } },
        { menteeEmail: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    const [sessions, totalCount] = await Promise.all([
      MentorSession.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      MentorSession.countDocuments(filter)
    ]);

    res.json({
      success: true,
      sessions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      filters: {
        status: status || null,
        startDate: startDate || null,
        endDate: endDate || null,
        search: search || null,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc'
      }
    });

  } catch (error) {
    console.error('Get mentor sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/mentor/sessions
 * @desc    Create a new session
 * @access  Private (Mentor only)
 */
router.post('/', sessionValidation, handleValidationErrors, async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    
    // Get mentor profile
    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    const {
      menteeId,
      menteeName,
      menteeEmail,
      title,
      description,
      scheduledStart,
      durationMinutes,
      topics,
      goals,
      sessionType,
      amount
    } = req.body;

    // Validate scheduled start time is in the future
    const startTime = new Date(scheduledStart);
    if (startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled start time must be in the future'
      });
    }

    // Check for scheduling conflicts
    const scheduledEnd = new Date(startTime.getTime() + (durationMinutes * 60 * 1000));
    const conflictingSessions = await MentorSession.find({
      mentorId: mentorProfile._id,
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
      $or: [
        {
          scheduledStart: { $lt: scheduledEnd },
          scheduledEnd: { $gt: startTime }
        }
      ]
    });

    if (conflictingSessions.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflicts with existing session',
        conflictingSessions: conflictingSessions.map(s => ({
          id: s._id,
          title: s.title,
          scheduledStart: s.scheduledStart,
          scheduledEnd: s.scheduledEnd
        }))
      });
    }

    // Create new session
    const session = new MentorSession({
      mentorId: mentorProfile._id,
      menteeId,
      menteeName: menteeName.trim(),
      menteeEmail: menteeEmail.toLowerCase(),
      title: title.trim(),
      description: description.trim(),
      scheduledStart: startTime,
      scheduledEnd: scheduledEnd,
      durationMinutes,
      topics: topics || [],
      goals: goals || [],
      sessionType: sessionType || 'one-on-one',
      payment: {
        amount: amount || mentorProfile.hourlyRate * (durationMinutes / 60),
        currency: 'USD',
        status: 'pending'
      }
    });

    await session.save();

    // Update mentor profile session count
    mentorProfile.totalSessions += 1;
    await mentorProfile.save();

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      session
    });

  } catch (error) {
    console.error('Create session error:', error);

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
      message: 'Failed to create session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentor/sessions/:id
 * @desc    Get specific session details
 * @access  Private (Mentor only)
 */
router.get('/:id', async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const sessionId = req.params.id;
    
    // Get mentor profile
    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    const session = await MentorSession.findOne({
      _id: sessionId,
      mentorId: mentorProfile._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/mentor/sessions/:id
 * @desc    Update session details
 * @access  Private (Mentor only)
 */
router.put('/:id', async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const sessionId = req.params.id;
    
    // Get mentor profile
    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    const session = await MentorSession.findOne({
      _id: sessionId,
      mentorId: mentorProfile._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const {
      title,
      description,
      scheduledStart,
      durationMinutes,
      topics,
      goals,
      notes,
      status
    } = req.body;

    // Update fields if provided
    if (title !== undefined) session.title = title.trim();
    if (description !== undefined) session.description = description.trim();
    if (topics !== undefined) session.topics = topics;
    if (goals !== undefined) session.goals = goals;
    if (notes !== undefined) {
      session.notes = { ...session.notes, ...notes };
    }

    // Handle status updates
    if (status !== undefined) {
      const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      session.status = status;

      // Handle status-specific logic
      if (status === 'in-progress' && !session.actualStart) {
        session.actualStart = new Date();
      }
      
      if (status === 'completed' && !session.actualEnd) {
        session.actualEnd = new Date();
        
        // Update mentor profile completed sessions count
        mentorProfile.completedSessions += 1;
        await mentorProfile.save();
      }
    }

    // Handle scheduling updates (only for scheduled sessions)
    if ((scheduledStart !== undefined || durationMinutes !== undefined) && session.status === 'scheduled') {
      const newStartTime = scheduledStart ? new Date(scheduledStart) : session.scheduledStart;
      const newDuration = durationMinutes !== undefined ? durationMinutes : session.durationMinutes;
      
      if (newStartTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled start time must be in the future'
        });
      }

      // Check for conflicts (excluding current session)
      const newEndTime = new Date(newStartTime.getTime() + (newDuration * 60 * 1000));
      const conflictingSessions = await MentorSession.find({
        _id: { $ne: sessionId },
        mentorId: mentorProfile._id,
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
        $or: [
          {
            scheduledStart: { $lt: newEndTime },
            scheduledEnd: { $gt: newStartTime }
          }
        ]
      });

      if (conflictingSessions.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Time slot conflicts with existing session',
          conflictingSessions: conflictingSessions.map(s => ({
            id: s._id,
            title: s.title,
            scheduledStart: s.scheduledStart,
            scheduledEnd: s.scheduledEnd
          }))
        });
      }

      session.scheduledStart = newStartTime;
      session.scheduledEnd = newEndTime;
      session.durationMinutes = newDuration;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Session updated successfully',
      session
    });

  } catch (error) {
    console.error('Update session error:', error);

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
      message: 'Failed to update session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/mentor/sessions/:id
 * @desc    Cancel/Delete session
 * @access  Private (Mentor only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const sessionId = req.params.id;
    const { reason } = req.body;
    
    // Get mentor profile
    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    const session = await MentorSession.findOne({
      _id: sessionId,
      mentorId: mentorProfile._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session can be cancelled
    if (!session.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Session cannot be cancelled. Must be cancelled at least 24 hours in advance.'
      });
    }

    // Calculate refund amount
    const refundAmount = session.calculateRefund();

    // Update session status and cancellation details
    session.status = 'cancelled';
    session.cancellation = {
      cancelledBy: 'mentor',
      cancelledAt: new Date(),
      reason: reason || 'Cancelled by mentor',
      refundAmount
    };

    // Update payment status if refund is due
    if (refundAmount > 0) {
      session.payment.status = 'refunded';
    }

    await session.save();

    res.json({
      success: true,
      message: 'Session cancelled successfully',
      session,
      refundAmount
    });

  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/mentor/sessions/:id/feedback
 * @desc    Add mentor feedback for session
 * @access  Private (Mentor only)
 */
router.post('/:id/feedback', [
  body('menteeRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Mentee rating must be between 1 and 5'),
  body('menteeReview')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Mentee review cannot exceed 1000 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const sessionId = req.params.id;
    
    // Get mentor profile
    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    const session = await MentorSession.findOne({
      _id: sessionId,
      mentorId: mentorProfile._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be added to completed sessions'
      });
    }

    const { menteeRating, menteeReview } = req.body;

    // Update feedback
    if (!session.feedback) {
      session.feedback = {};
    }

    if (menteeRating !== undefined) {
      session.feedback.menteeRating = menteeRating;
    }
    
    if (menteeReview !== undefined) {
      session.feedback.menteeReview = menteeReview.trim();
    }

    await session.save();

    res.json({
      success: true,
      message: 'Feedback added successfully',
      feedback: session.feedback
    });

  } catch (error) {
    console.error('Add session feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;