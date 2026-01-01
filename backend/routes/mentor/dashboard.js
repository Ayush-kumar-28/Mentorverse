const express = require('express');
const { MentorProfile, MentorSession } = require('../../models/mentor');
const { mentorAuthMiddleware } = require('../../middleware/mentorAuthMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(mentorAuthMiddleware);

/**
 * @route   GET /api/mentor/dashboard/stats
 * @desc    Get mentor dashboard statistics
 * @access  Private (Mentor only)
 */
router.get('/stats', async (req, res) => {
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

    // Get session statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const [
      totalSessions,
      completedSessions,
      upcomingSessions,
      cancelledSessions,
      thisMonthSessions,
      thisWeekSessions,
      totalEarnings,
      thisMonthEarnings,
      averageRating,
      totalReviews
    ] = await Promise.all([
      MentorSession.countDocuments({ mentorId: mentorProfile._id }),
      MentorSession.countDocuments({ mentorId: mentorProfile._id, status: 'completed' }),
      MentorSession.countDocuments({ 
        mentorId: mentorProfile._id, 
        status: { $in: ['scheduled', 'confirmed'] },
        scheduledStart: { $gte: new Date() }
      }),
      MentorSession.countDocuments({ mentorId: mentorProfile._id, status: 'cancelled' }),
      MentorSession.countDocuments({ 
        mentorId: mentorProfile._id,
        createdAt: { $gte: startOfMonth }
      }),
      MentorSession.countDocuments({ 
        mentorId: mentorProfile._id,
        createdAt: { $gte: startOfWeek }
      }),
      MentorSession.aggregate([
        { $match: { mentorId: mentorProfile._id, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      MentorSession.aggregate([
        { 
          $match: { 
            mentorId: mentorProfile._id, 
            'payment.status': 'paid',
            createdAt: { $gte: startOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      MentorSession.aggregate([
        { $match: { mentorId: mentorProfile._id, 'feedback.menteeRating': { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$feedback.menteeRating' } } }
      ]),
      MentorSession.countDocuments({ 
        mentorId: mentorProfile._id, 
        'feedback.menteeReview': { $exists: true, $ne: '' }
      })
    ]);

    // Calculate completion rate
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Calculate response time (mock data for now)
    const responseTime = mentorProfile.responseTime || 60; // minutes

    const stats = {
      overview: {
        totalSessions,
        completedSessions,
        upcomingSessions,
        cancelledSessions,
        completionRate: Math.round(completionRate * 100) / 100,
        responseTime
      },
      earnings: {
        total: totalEarnings[0]?.total || 0,
        thisMonth: thisMonthEarnings[0]?.total || 0,
        currency: 'USD'
      },
      ratings: {
        average: averageRating[0]?.avgRating ? Math.round(averageRating[0].avgRating * 100) / 100 : 0,
        totalReviews
      },
      activity: {
        thisMonth: thisMonthSessions,
        thisWeek: thisWeekSessions
      },
      profile: {
        completionPercentage: mentorProfile.completionPercentage,
        isVerified: mentorProfile.isVerified,
        totalExpertise: mentorProfile.expertise.length,
        yearsOfExperience: mentorProfile.yearsOfExperience
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get mentor dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentor/dashboard/sessions
 * @desc    Get mentor sessions with filtering and pagination
 * @access  Private (Mentor only)
 */
router.get('/sessions', async (req, res) => {
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

    // Build filter
    const filter = { mentorId: mentorProfile._id };

    if (status && ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'].includes(status)) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.scheduledStart = {};
      if (startDate) {
        filter.scheduledStart.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.scheduledStart.$lte = new Date(endDate);
      }
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
 * @route   GET /api/mentor/dashboard/earnings
 * @desc    Get mentor earnings data
 * @access  Private (Mentor only)
 */
router.get('/earnings', async (req, res) => {
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

    const period = req.query.period || 'month'; // month, quarter, year
    const year = parseInt(req.query.year) || new Date().getFullYear();

    let startDate, endDate, groupBy;

    switch (period) {
      case 'year':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year + 1, 0, 1);
        groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
        break;
      case 'quarter':
        const quarter = parseInt(req.query.quarter) || Math.ceil((new Date().getMonth() + 1) / 3);
        startDate = new Date(year, (quarter - 1) * 3, 1);
        endDate = new Date(year, quarter * 3, 1);
        groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
        break;
      default: // month
        const month = parseInt(req.query.month) || new Date().getMonth();
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 1);
        groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
    }

    const earningsData = await MentorSession.aggregate([
      {
        $match: {
          mentorId: mentorProfile._id,
          'payment.status': 'paid',
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalEarnings: { $sum: '$payment.amount' },
          sessionCount: { $sum: 1 },
          avgSessionValue: { $avg: '$payment.amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Calculate totals
    const totals = await MentorSession.aggregate([
      {
        $match: {
          mentorId: mentorProfile._id,
          'payment.status': 'paid',
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$payment.amount' },
          totalSessions: { $sum: 1 },
          avgSessionValue: { $avg: '$payment.amount' }
        }
      }
    ]);

    res.json({
      success: true,
      earnings: {
        data: earningsData,
        totals: totals[0] || { totalEarnings: 0, totalSessions: 0, avgSessionValue: 0 },
        period: {
          type: period,
          startDate,
          endDate,
          year,
          ...(period === 'quarter' && { quarter: req.query.quarter }),
          ...(period === 'month' && { month: req.query.month })
        }
      }
    });

  } catch (error) {
    console.error('Get mentor earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentor/dashboard/analytics
 * @desc    Get mentor analytics data
 * @access  Private (Mentor only)
 */
router.get('/analytics', async (req, res) => {
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

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));

    // Session trends (last 30 days)
    const sessionTrends = await MentorSession.aggregate([
      {
        $match: {
          mentorId: mentorProfile._id,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          sessions: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Rating trends (last 6 months)
    const ratingTrends = await MentorSession.aggregate([
      {
        $match: {
          mentorId: mentorProfile._id,
          'feedback.menteeRating': { $exists: true },
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          avgRating: { $avg: '$feedback.menteeRating' },
          ratingCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Popular session topics
    const popularTopics = await MentorSession.aggregate([
      {
        $match: {
          mentorId: mentorProfile._id,
          topics: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$topics'
      },
      {
        $group: {
          _id: '$topics',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Session duration analysis
    const durationAnalysis = await MentorSession.aggregate([
      {
        $match: {
          mentorId: mentorProfile._id,
          status: 'completed',
          actualStart: { $exists: true },
          actualEnd: { $exists: true }
        }
      },
      {
        $project: {
          actualDuration: {
            $divide: [
              { $subtract: ['$actualEnd', '$actualStart'] },
              1000 * 60 // Convert to minutes
            ]
          },
          scheduledDuration: '$durationMinutes'
        }
      },
      {
        $group: {
          _id: null,
          avgActualDuration: { $avg: '$actualDuration' },
          avgScheduledDuration: { $avg: '$scheduledDuration' },
          totalSessions: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        sessionTrends,
        ratingTrends,
        popularTopics,
        durationAnalysis: durationAnalysis[0] || {
          avgActualDuration: 0,
          avgScheduledDuration: 0,
          totalSessions: 0
        }
      }
    });

  } catch (error) {
    console.error('Get mentor analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentor/dashboard/recent-activity
 * @desc    Get mentor recent activity
 * @access  Private (Mentor only)
 */
router.get('/recent-activity', async (req, res) => {
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

    const limit = parseInt(req.query.limit) || 10;

    // Get recent sessions
    const recentSessions = await MentorSession.find({
      mentorId: mentorProfile._id
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('menteeName menteeEmail scheduledStart status createdAt feedback.menteeRating')
    .lean();

    // Format activity items
    const activities = recentSessions.map(session => ({
      id: session._id,
      type: 'session',
      title: `Session with ${session.menteeName}`,
      description: `${session.status} session scheduled for ${new Date(session.scheduledStart).toLocaleDateString()}`,
      timestamp: session.createdAt,
      status: session.status,
      rating: session.feedback?.menteeRating || null,
      mentee: {
        name: session.menteeName,
        email: session.menteeEmail
      }
    }));

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Get mentor recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;