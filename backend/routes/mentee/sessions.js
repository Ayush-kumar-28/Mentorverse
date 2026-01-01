const express = require('express');
const { body, validationResult } = require('express-validator');
const { MenteeSession, MenteeProfile } = require('../../models/mentee');
const { menteeAuthMiddleware, validateSessionOwnership } = require('../../middleware/menteeAuthMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(menteeAuthMiddleware);

// Validation middleware
const sessionValidation = [
  body('mentorId')
    .notEmpty()
    .withMessage('Mentor ID is required'),
  body('mentorName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Mentor name must be between 2 and 100 characters'),
  body('mentorEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid mentor email is required'),
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
 * @route   GET /api/mentee/sessions
 * @desc    Get mentee sessions with filtering and pagination
 * @access  Private (Mentee only)
 */
router.get('/', async (req, res) => {
  try {
    const menteeId = req.mentee.id;
    
    // Get mentee profile
    const menteeProfile = await MenteeProfile.findOne({ userId: menteeId });
    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentee profile not found'
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
    const mentorId = req.query.mentorId;
    const sessionType = req.query.sessionType;

    // Build filter
    const filter = { menteeId: menteeProfile._id };

    if (status && ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'].includes(status)) {
      filter.status = status;
    }

    if (mentorId) {
      filter.mentorId = mentorId;
    }

    if (sessionType && ['one-on-one', 'group', 'workshop', 'code-review', 'career-guidance', 'mock-interview'].includes(sessionType)) {
      filter.sessionType = sessionType;
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
        { mentorName: { $regex: search, $options: 'i' } },
        { mentorEmail: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    const [sessions, totalCount] = await Promise.all([
      MenteeSession.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      MenteeSession.countDocuments(filter)
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
        mentorId: mentorId || null,
        sessionType: sessionType || null,
        startDate: startDate || null,
        endDate: endDate || null,
        search: search || null,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc'
      }
    });

  } catch (error) {
    console.error('Get mentee sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/mentee/sessions
 * @desc    Book a new session
 * @access  Private (Mentee only)
 */
router.post('/', sessionValidation, handleValidationErrors, async (req, res) => {
  try {
    const menteeId = req.mentee.id;
    
    // Get mentee profile
    const menteeProfile = await MenteeProfile.findOne({ userId: menteeId });
    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentee profile not found'
      });
    }

    const {
      mentorId,
      mentorName,
      mentorEmail,
      mentorAvatar,
      title,
      description,
      scheduledStart,
      durationMinutes,
      topics,
      goals,
      sessionType,
      category,
      amount,
      timezone,
      agenda,
      materials
    } = req.body;

    // Validate scheduled start time is in the future
    const startTime = new Date(scheduledStart);
    if (startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled start time must be in the future'
      });
    }

    // Check for scheduling conflicts for the mentee
    const scheduledEnd = new Date(startTime.getTime() + (durationMinutes * 60 * 1000));
    const conflictingSessions = await MenteeSession.find({
      menteeId: menteeProfile._id,
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
    const session = new MenteeSession({
      menteeId: menteeProfile._id,
      mentorId,
      mentorName: mentorName.trim(),
      mentorEmail: mentorEmail.toLowerCase(),
      mentorAvatar: mentorAvatar || '',
      title: title.trim(),
      description: description.trim(),
      scheduledStart: startTime,
      scheduledEnd: scheduledEnd,
      durationMinutes,
      timezone: timezone || 'UTC',
      topics: topics || [],
      goals: goals || [],
      sessionType: sessionType || 'one-on-one',
      category: category || 'general',
      agenda: agenda || [],
      materials: materials || { prework: [], resources: [], homework: [] },
      payment: {
        amount: amount || 0,
        currency: 'USD',
        status: 'pending'
      }
    });

    await session.save();

    // Update mentee profile session count
    menteeProfile.totalSessions += 1;
    await menteeProfile.save();

    res.status(201).json({
      success: true,
      message: 'Session booked successfully',
      session
    });

  } catch (error) {
    console.error('Book session error:', error);

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
      message: 'Failed to book session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentee/sessions/upcoming
 * @desc    Get upcoming sessions for mentee
 * @access  Private (Mentee only)
 */
router.get('/upcoming', async (req, res) => {
  try {
    const menteeId = req.mentee.id;
    
    // Get mentee profile
    const menteeProfile = await MenteeProfile.findOne({ userId: menteeId });
    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentee profile not found'
      });
    }

    const limit = parseInt(req.query.limit) || 10;

    const upcomingSessions = await MenteeSession.findUpcoming(menteeProfile._id, limit);

    res.json({
      success: true,
      sessions: upcomingSessions
    });

  } catch (error) {
    console.error('Get upcoming sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentee/sessions/past
 * @desc    Get past sessions for mentee
 * @access  Private (Mentee only)
 */
router.get('/past', async (req, res) => {
  try {
    const menteeId = req.mentee.id;
    
    // Get mentee profile
    const menteeProfile = await MenteeProfile.findOne({ userId: menteeId });
    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentee profile not found'
      });
    }

    const limit = parseInt(req.query.limit) || 10;

    const pastSessions = await MenteeSession.findPast(menteeProfile._id, limit);

    res.json({
      success: true,
      sessions: pastSessions
    });

  } catch (error) {
    console.error('Get past sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch past sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentee/sessions/:id
 * @desc    Get specific session details
 * @access  Private (Mentee only)
 */
router.get('/:id', validateSessionOwnership, async (req, res) => {
  try {
    const session = req.session; // Set by validateSessionOwnership middleware

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
 * @route   PUT /api/mentee/sessions/:id
 * @desc    Update session details (limited fields for mentee)
 * @access  Private (Mentee only)
 */
router.put('/:id', validateSessionOwnership, async (req, res) => {
  try {
    const session = req.session; // Set by validateSessionOwnership middleware

    const {
      notes,
      agenda,
      materials
    } = req.body;

    // Mentees can only update their notes, agenda items, and materials
    if (notes && notes.mentee !== undefined) {
      session.notes.mentee = notes.mentee.trim();
    }

    if (agenda !== undefined) {
      session.agenda = agenda;
    }

    if (materials !== undefined) {
      session.materials = { ...session.materials, ...materials };
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
 * @route   POST /api/mentee/sessions/:id/cancel
 * @desc    Cancel session
 * @access  Private (Mentee only)
 */
router.post('/:id/cancel', validateSessionOwnership, async (req, res) => {
  try {
    const session = req.session; // Set by validateSessionOwnership middleware
    const { reason } = req.body;

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
      cancelledBy: 'mentee',
      cancelledAt: new Date(),
      reason: reason || 'Cancelled by mentee',
      refundAmount
    };

    // Update payment status if refund is due
    if (refundAmount > 0) {
      session.payment.status = 'refunded';
    }

    await session.save();

    // Update mentee profile stats
    const menteeProfile = await MenteeProfile.findOne({ userId: req.mentee.id });
    if (menteeProfile) {
      menteeProfile.cancelledSessions += 1;
      await menteeProfile.save();
    }

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
 * @route   POST /api/mentee/sessions/:id/reschedule
 * @desc    Request session reschedule
 * @access  Private (Mentee only)
 */
router.post('/:id/reschedule', validateSessionOwnership, [
  body('newScheduledStart')
    .isISO8601()
    .withMessage('Valid new scheduled start date is required'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const session = req.session; // Set by validateSessionOwnership middleware
    const { newScheduledStart, reason } = req.body;

    // Check if session can be rescheduled
    if (!session.canBeRescheduled()) {
      return res.status(400).json({
        success: false,
        message: 'Session cannot be rescheduled. Must be rescheduled at least 48 hours in advance and maximum 3 reschedules allowed.'
      });
    }

    const newStartTime = new Date(newScheduledStart);
    if (newStartTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'New scheduled start time must be in the future'
      });
    }

    // Check for conflicts with new time
    const newEndTime = new Date(newStartTime.getTime() + (session.durationMinutes * 60 * 1000));
    const conflictingSessions = await MenteeSession.find({
      _id: { $ne: session._id },
      menteeId: session.menteeId,
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
        message: 'New time slot conflicts with existing session',
        conflictingSessions: conflictingSessions.map(s => ({
          id: s._id,
          title: s.title,
          scheduledStart: s.scheduledStart,
          scheduledEnd: s.scheduledEnd
        }))
      });
    }

    // Update session with rescheduling information
    session.rescheduling = {
      rescheduledBy: 'mentee',
      rescheduledAt: new Date(),
      previousScheduledStart: session.scheduledStart,
      previousScheduledEnd: session.scheduledEnd,
      reason: reason || 'Rescheduled by mentee',
      rescheduleCount: (session.rescheduling.rescheduleCount || 0) + 1
    };

    session.scheduledStart = newStartTime;
    session.scheduledEnd = newEndTime;
    session.status = 'rescheduled';

    await session.save();

    res.json({
      success: true,
      message: 'Session reschedule requested successfully',
      session
    });

  } catch (error) {
    console.error('Reschedule session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/mentee/sessions/:id/feedback
 * @desc    Add mentee feedback for session
 * @access  Private (Mentee only)
 */
router.post('/:id/feedback', validateSessionOwnership, [
  body('menteeRating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Mentee rating must be between 1 and 5'),
  body('menteeReview')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Mentee review cannot exceed 1000 characters'),
  body('menteeSkillsImproved')
    .optional()
    .isArray()
    .withMessage('Skills improved must be an array'),
  body('menteeGoalsAchieved')
    .optional()
    .isArray()
    .withMessage('Goals achieved must be an array'),
  body('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('Would recommend must be a boolean')
], handleValidationErrors, async (req, res) => {
  try {
    const session = req.session; // Set by validateSessionOwnership middleware

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be added to completed sessions'
      });
    }

    const { 
      menteeRating, 
      menteeReview, 
      menteeSkillsImproved, 
      menteeGoalsAchieved, 
      wouldRecommend 
    } = req.body;

    // Update feedback
    if (!session.feedback) {
      session.feedback = {};
    }

    session.feedback.menteeRating = menteeRating;
    
    if (menteeReview !== undefined) {
      session.feedback.menteeReview = menteeReview.trim();
    }
    
    if (menteeSkillsImproved !== undefined) {
      session.feedback.menteeSkillsImproved = menteeSkillsImproved;
    }
    
    if (menteeGoalsAchieved !== undefined) {
      session.feedback.menteeGoalsAchieved = menteeGoalsAchieved;
    }
    
    if (wouldRecommend !== undefined) {
      session.feedback.wouldRecommend = wouldRecommend;
    }

    session.feedback.feedbackSubmittedAt = new Date();

    await session.save();

    // Update mentee profile stats
    const menteeProfile = await MenteeProfile.findOne({ userId: req.mentee.id });
    if (menteeProfile) {
      // Recalculate average rating
      const allRatedSessions = await MenteeSession.find({
        menteeId: menteeProfile._id,
        'feedback.menteeRating': { $exists: true }
      });
      
      if (allRatedSessions.length > 0) {
        const totalRating = allRatedSessions.reduce((sum, s) => sum + s.feedback.menteeRating, 0);
        menteeProfile.averageRating = totalRating / allRatedSessions.length;
      }
      
      menteeProfile.totalReviews = allRatedSessions.filter(s => s.feedback.menteeReview).length;
      await menteeProfile.save();
    }

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

/**
 * @route   POST /api/mentee/sessions/:id/complete-prework
 * @desc    Mark prework as completed
 * @access  Private (Mentee only)
 */
router.post('/:id/complete-prework', validateSessionOwnership, [
  body('preworkId')
    .notEmpty()
    .withMessage('Prework ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const session = req.session; // Set by validateSessionOwnership middleware
    const { preworkId } = req.body;

    const preworkItem = session.materials.prework.id(preworkId);
    if (!preworkItem) {
      return res.status(404).json({
        success: false,
        message: 'Prework item not found'
      });
    }

    preworkItem.isCompleted = true;
    await session.save();

    res.json({
      success: true,
      message: 'Prework marked as completed',
      prework: preworkItem
    });

  } catch (error) {
    console.error('Complete prework error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete prework',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;