const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Session = require('../models/Session');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the authenticated user
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Get all sessions for the user
    const sessions = await Session.find({ createdBy: userId }).sort({ scheduledStart: -1 });
    
    // Calculate statistics
    let completedCount = 0;
    let upcomingCount = 0;
    let actuallyCompletedCount = 0;
    let sessionHistoryCount = 0;
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.scheduledStart);
      const isPastSession = sessionDate < now || session.status === 'completed' || session.status === 'cancelled';
      
      if (isPastSession) {
        sessionHistoryCount++;
        if (session.status === 'completed') {
          actuallyCompletedCount++;
        }
      } else {
        upcomingCount++;
      }
    });
    
    // Calculate progress percentage
    const progressPercentage = sessionHistoryCount > 0 ? 
      Math.round((actuallyCompletedCount / sessionHistoryCount) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        totalSessions: sessions.length,
        completedSessions: sessionHistoryCount, // All past sessions (session history)
        upcomingSessions: upcomingCount,
        actuallyCompleted: actuallyCompletedCount,
        progressPercentage,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/dashboard/monthly-activity
 * Get monthly session activity data for charts
 */
router.get('/monthly-activity', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Get sessions from the last 12 months
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const sessions = await Session.find({
      createdBy: userId,
      scheduledStart: { $gte: twelveMonthsAgo }
    }).sort({ scheduledStart: 1 });
    
    // Initialize monthly data for last 12 months
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        monthKey: `${date.getFullYear()}-${date.getMonth()}`,
        completed: 0,
        upcoming: 0,
        cancelled: 0
      });
    }
    
    // Count sessions by month
    sessions.forEach(session => {
      const sessionDate = new Date(session.scheduledStart);
      const monthKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth()}`;
      const monthData = monthlyData.find(m => m.monthKey === monthKey);
      
      if (monthData) {
        const isPastSession = sessionDate < now || session.status === 'completed' || session.status === 'cancelled';
        
        if (isPastSession) {
          if (session.status === 'completed') {
            monthData.completed++;
          } else if (session.status === 'cancelled') {
            monthData.cancelled++;
          } else {
            // Date passed but status still upcoming
            monthData.completed++;
          }
        } else {
          monthData.upcoming++;
        }
      }
    });
    
    // Remove monthKey from response (internal use only)
    const responseData = monthlyData.map(({ monthKey, ...data }) => data);
    
    res.json({
      success: true,
      data: responseData,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching monthly activity:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch monthly activity data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/dashboard/favorite-mentors
 * Get favorite mentors based on session history
 */
router.get('/favorite-mentors', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const limit = parseInt(req.query.limit) || 4;
    
    // Get all past sessions
    const sessions = await Session.find({ createdBy: userId }).sort({ scheduledStart: -1 });
    
    // Count sessions per mentor
    const mentorStats = new Map();
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.scheduledStart);
      const isPastSession = sessionDate < now || session.status === 'completed' || session.status === 'cancelled';
      
      if (isPastSession && session.mentor && session.mentor.name) {
        const mentorName = session.mentor.name;
        const existing = mentorStats.get(mentorName);
        
        if (existing) {
          existing.sessionCount++;
          existing.lastSessionDate = sessionDate > existing.lastSessionDate ? sessionDate : existing.lastSessionDate;
          if (session.status === 'completed') {
            existing.completedCount++;
          }
        } else {
          mentorStats.set(mentorName, {
            mentor: {
              name: session.mentor.name,
              title: session.mentor.title || '',
              company: session.mentor.company || '',
              expertise: session.mentor.expertise || [],
              email: session.mentor.email || ''
            },
            sessionCount: 1,
            completedCount: session.status === 'completed' ? 1 : 0,
            lastSessionDate: sessionDate
          });
        }
      }
    });
    
    // Sort by session count and recency, then limit results
    const favoriteMentors = Array.from(mentorStats.values())
      .sort((a, b) => {
        // First sort by session count
        if (b.sessionCount !== a.sessionCount) {
          return b.sessionCount - a.sessionCount;
        }
        // Then by most recent session
        return b.lastSessionDate.getTime() - a.lastSessionDate.getTime();
      })
      .slice(0, limit)
      .map(mentorData => ({
        ...mentorData,
        lastSessionDate: mentorData.lastSessionDate.toISOString()
      }));
    
    res.json({
      success: true,
      data: favoriteMentors,
      total: mentorStats.size,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching favorite mentors:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch favorite mentors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/dashboard/recent-activity
 * Get recent session activity for the user
 */
router.get('/recent-activity', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;
    
    // Get recent sessions
    const recentSessions = await Session.find({ createdBy: userId })
      .sort({ scheduledStart: -1 })
      .limit(limit);
    
    const activities = recentSessions.map(session => ({
      id: session._id.toString(),
      type: 'session',
      mentorName: session.mentor.name,
      scheduledStart: session.scheduledStart.toISOString(),
      status: session.status,
      durationMinutes: session.durationMinutes
    }));
    
    res.json({
      success: true,
      data: activities,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recent activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;