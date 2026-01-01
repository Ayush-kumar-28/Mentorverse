const express = require('express');
const { MenteeProfile, MenteeSession } = require('../../models/mentee');
const { menteeAuthMiddleware } = require('../../middleware/menteeAuthMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(menteeAuthMiddleware);

/**
 * @route   GET /api/mentee/dashboard/stats
 * @desc    Get mentee dashboard statistics
 * @access  Private (Mentee only)
 */
router.get('/stats', async (req, res) => {
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
      totalSpent,
      thisMonthSpent,
      averageSessionRating,
      totalReviews,
      uniqueMentors
    ] = await Promise.all([
      MenteeSession.countDocuments({ menteeId: menteeProfile._id }),
      MenteeSession.countDocuments({ menteeId: menteeProfile._id, status: 'completed' }),
      MenteeSession.countDocuments({ 
        menteeId: menteeProfile._id, 
        status: { $in: ['scheduled', 'confirmed'] },
        scheduledStart: { $gte: new Date() }
      }),
      MenteeSession.countDocuments({ menteeId: menteeProfile._id, status: 'cancelled' }),
      MenteeSession.countDocuments({ 
        menteeId: menteeProfile._id,
        createdAt: { $gte: startOfMonth }
      }),
      MenteeSession.countDocuments({ 
        menteeId: menteeProfile._id,
        createdAt: { $gte: startOfWeek }
      }),
      MenteeSession.aggregate([
        { $match: { menteeId: menteeProfile._id, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      MenteeSession.aggregate([
        { 
          $match: { 
            menteeId: menteeProfile._id, 
            'payment.status': 'paid',
            createdAt: { $gte: startOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      MenteeSession.aggregate([
        { $match: { menteeId: menteeProfile._id, 'feedback.menteeRating': { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$feedback.menteeRating' } } }
      ]),
      MenteeSession.countDocuments({ 
        menteeId: menteeProfile._id, 
        'feedback.menteeReview': { $exists: true, $ne: '' }
      }),
      MenteeSession.distinct('mentorId', { menteeId: menteeProfile._id })
    ]);

    // Calculate completion rate
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Calculate average session cost
    const avgSessionCost = totalSessions > 0 ? (totalSpent[0]?.total || 0) / totalSessions : 0;

    const stats = {
      overview: {
        totalSessions,
        completedSessions,
        upcomingSessions,
        cancelledSessions,
        completionRate: Math.round(completionRate * 100) / 100,
        uniqueMentors: uniqueMentors.length
      },
      spending: {
        total: totalSpent[0]?.total || 0,
        thisMonth: thisMonthSpent[0]?.total || 0,
        averagePerSession: Math.round(avgSessionCost * 100) / 100,
        currency: 'USD'
      },
      ratings: {
        average: averageSessionRating[0]?.avgRating ? Math.round(averageSessionRating[0].avgRating * 100) / 100 : 0,
        totalReviews
      },
      activity: {
        thisMonth: thisMonthSessions,
        thisWeek: thisWeekSessions
      },
      profile: {
        completionPercentage: menteeProfile.completionPercentage,
        isProfileComplete: menteeProfile.isProfileComplete,
        experienceLevel: menteeProfile.experienceLevel,
        totalSkills: menteeProfile.skills.length,
        totalInterests: menteeProfile.interests.length,
        favoriteMentorsCount: menteeProfile.favoriteMentors.length
      },
      goals: {
        shortTermGoals: menteeProfile.careerGoals.shortTerm.length,
        longTermGoals: menteeProfile.careerGoals.longTerm.length,
        learningPathProgress: menteeProfile.learningPath.progress || 0
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get mentee dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentee/dashboard/sessions
 * @desc    Get mentee sessions with filtering and pagination
 * @access  Private (Mentee only)
 */
router.get('/sessions', async (req, res) => {
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
 * @route   GET /api/mentee/dashboard/spending
 * @desc    Get mentee spending data
 * @access  Private (Mentee only)
 */
router.get('/spending', async (req, res) => {
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

    const spendingData = await MenteeSession.aggregate([
      {
        $match: {
          menteeId: menteeProfile._id,
          'payment.status': 'paid',
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalSpent: { $sum: '$payment.amount' },
          sessionCount: { $sum: 1 },
          avgSessionCost: { $avg: '$payment.amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Calculate totals
    const totals = await MenteeSession.aggregate([
      {
        $match: {
          menteeId: menteeProfile._id,
          'payment.status': 'paid',
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$payment.amount' },
          totalSessions: { $sum: 1 },
          avgSessionCost: { $avg: '$payment.amount' }
        }
      }
    ]);

    res.json({
      success: true,
      spending: {
        data: spendingData,
        totals: totals[0] || { totalSpent: 0, totalSessions: 0, avgSessionCost: 0 },
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
    console.error('Get mentee spending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spending data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentee/dashboard/analytics
 * @desc    Get mentee analytics data
 * @access  Private (Mentee only)
 */
router.get('/analytics', async (req, res) => {
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

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));

    // Session trends (last 30 days)
    const sessionTrends = await MenteeSession.aggregate([
      {
        $match: {
          menteeId: menteeProfile._id,
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
          },
          totalSpent: { $sum: '$payment.amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Learning progress trends (last 6 months)
    const learningTrends = await MenteeSession.aggregate([
      {
        $match: {
          menteeId: menteeProfile._id,
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sessionsCompleted: { $sum: 1 },
          avgRating: { $avg: '$feedback.menteeRating' },
          skillsImproved: { $sum: { $size: { $ifNull: ['$feedback.menteeSkillsImproved', []] } } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Popular session topics
    const popularTopics = await MenteeSession.aggregate([
      {
        $match: {
          menteeId: menteeProfile._id,
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

    // Mentor interaction analysis
    const mentorAnalysis = await MenteeSession.aggregate([
      {
        $match: {
          menteeId: menteeProfile._id
        }
      },
      {
        $group: {
          _id: '$mentorId',
          mentorName: { $first: '$mentorName' },
          sessionCount: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalSpent: { $sum: '$payment.amount' },
          avgRating: { $avg: '$feedback.menteeRating' },
          lastSession: { $max: '$scheduledStart' }
        }
      },
      {
        $sort: { sessionCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Goal achievement analysis
    const goalAnalysis = {
      shortTermGoals: menteeProfile.careerGoals.shortTerm.length,
      longTermGoals: menteeProfile.careerGoals.longTerm.length,
      completedGoals: menteeProfile.careerGoals.shortTerm.filter(goal => goal.isCompleted).length +
                     menteeProfile.careerGoals.longTerm.filter(goal => goal.isCompleted).length,
      learningPathProgress: menteeProfile.learningPath.progress || 0,
      completedMilestones: menteeProfile.learningPath.milestones ? 
                          menteeProfile.learningPath.milestones.filter(m => m.isCompleted).length : 0,
      totalMilestones: menteeProfile.learningPath.milestones ? 
                      menteeProfile.learningPath.milestones.length : 0
    };

    res.json({
      success: true,
      analytics: {
        sessionTrends,
        learningTrends,
        popularTopics,
        mentorAnalysis,
        goalAnalysis
      }
    });

  } catch (error) {
    console.error('Get mentee analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentee/dashboard/recent-activity
 * @desc    Get mentee recent activity
 * @access  Private (Mentee only)
 */
router.get('/recent-activity', async (req, res) => {
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

    // Get recent sessions
    const recentSessions = await MenteeSession.find({
      menteeId: menteeProfile._id
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('mentorName mentorEmail scheduledStart status createdAt feedback.menteeRating payment.amount')
    .lean();

    // Format activity items
    const activities = recentSessions.map(session => ({
      id: session._id,
      type: 'session',
      title: `Session with ${session.mentorName}`,
      description: `${session.status} session scheduled for ${new Date(session.scheduledStart).toLocaleDateString()}`,
      timestamp: session.createdAt,
      status: session.status,
      rating: session.feedback?.menteeRating || null,
      amount: session.payment?.amount || 0,
      mentor: {
        name: session.mentorName,
        email: session.mentorEmail
      }
    }));

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Get mentee recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentee/dashboard/recommendations
 * @desc    Get personalized mentor recommendations
 * @access  Private (Mentee only)
 */
router.get('/recommendations', async (req, res) => {
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

    // This would typically integrate with the main mentor database
    // For now, return a placeholder response
    const recommendations = {
      basedOnSkills: [],
      basedOnGoals: [],
      basedOnIndustry: [],
      trending: [],
      newMentors: []
    };

    res.json({
      success: true,
      recommendations,
      message: 'Mentor recommendations based on your profile and preferences'
    });

  } catch (error) {
    console.error('Get mentor recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;