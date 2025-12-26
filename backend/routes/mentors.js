const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const MentorProfile = require('../models/MentorProfile');

const router = express.Router();

// Helper function to generate default availability based on mentor ID (deterministic)
const generateDefaultAvailability = (mentorId) => {
  const availability = {};
  const today = new Date();
  
  // Create a simple hash from mentor ID for consistent randomness
  const hash = mentorId.toString().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Use hash to create a pseudo-random seed
  let seed = Math.abs(hash);
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  // Generate availability for next 30 days
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateKey = date.toISOString().split('T')[0];
    
    // Default time slots for mentors (using seeded random)
    const timeSlots = [];
    
    // Morning slots (9 AM - 12 PM) - 70% chance
    if (seededRandom() > 0.3) {
      timeSlots.push('9:00 AM', '10:00 AM', '11:00 AM');
    }
    
    // Afternoon slots (1 PM - 5 PM) - 60% chance
    if (seededRandom() > 0.4) {
      timeSlots.push('1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM');
    }
    
    // Evening slots (6 PM - 8 PM) - 40% chance
    if (seededRandom() > 0.6) {
      timeSlots.push('6:00 PM', '7:00 PM');
    }
    
    if (timeSlots.length > 0) {
      availability[dateKey] = timeSlots;
    }
  }
  
  return availability;
};

/**
 * GET /api/mentors
 * Get all active mentors (public endpoint for mentees to browse)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt'; // createdAt, rating, totalSessions
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const expertise = req.query.expertise; // Filter by expertise

    // Build filter
    const filter = {
      isActive: true,
      isProfileComplete: true
    };

    if (expertise) {
      filter.expertise = { $in: [expertise] };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    const [mentors, totalCount] = await Promise.all([
      MentorProfile.find(filter)
        .populate('userId', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      MentorProfile.countDocuments(filter)
    ]);

    // Transform data for response
    const mentorList = mentors.map(mentor => {
      const mentorData = mentor.toObject();
      const availability = Object.fromEntries(mentorData.availability || new Map());
      
      // If no availability is set, generate default availability based on mentor ID
      const finalAvailability = Object.keys(availability).length === 0 
        ? generateDefaultAvailability(mentorData._id) 
        : availability;
      
      return {
        id: mentorData._id,
        name: mentorData.userId.name,
        email: mentorData.userId.email,
        avatar: mentorData.userId.avatar || '',
        title: mentorData.title,
        company: mentorData.company,
        bio: mentorData.bio,
        expertise: mentorData.expertise,
        yearsOfExperience: mentorData.yearsOfExperience,
        rating: mentorData.rating,
        totalSessions: mentorData.totalSessions,
        totalReviews: mentorData.totalReviews,
        linkedin: mentorData.linkedin,
        languages: mentorData.languages,
        availability: finalAvailability,
        isNew: (new Date() - new Date(mentorData.createdAt)) < (7 * 24 * 60 * 60 * 1000) // New if created within 7 days
      };
    });

    res.json({
      success: true,
      mentors: mentorList,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      filters: {
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc',
        expertise: expertise || null
      }
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch mentors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/mentors/new
 * Get recently joined mentors (for highlighting new mentors)
 */
router.get('/new', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const daysBack = parseInt(req.query.days) || 7; // Default to 7 days

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const newMentors = await MentorProfile.find({
      isActive: true,
      isProfileComplete: true,
      createdAt: { $gte: cutoffDate }
    })
    .populate('userId', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(limit);

    const mentorList = newMentors.map(mentor => {
      const mentorData = mentor.toObject();
      const availability = Object.fromEntries(mentorData.availability || new Map());
      
      // If no availability is set, generate default availability based on mentor ID
      const finalAvailability = Object.keys(availability).length === 0 
        ? generateDefaultAvailability(mentorData._id) 
        : availability;
      
      return {
        id: mentorData._id,
        name: mentorData.userId.name,
        email: mentorData.userId.email,
        avatar: mentorData.userId.avatar || '',
        title: mentorData.title,
        company: mentorData.company,
        bio: mentorData.bio,
        expertise: mentorData.expertise.slice(0, 3), // Show only first 3 expertise areas
        yearsOfExperience: mentorData.yearsOfExperience,
        rating: mentorData.rating,
        totalSessions: mentorData.totalSessions,
        availability: finalAvailability,
        joinedDate: mentorData.createdAt
      };
    });

    res.json({
      success: true,
      newMentors: mentorList,
      count: mentorList.length,
      daysBack
    });
  } catch (error) {
    console.error('Error fetching new mentors:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch new mentors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/mentors/:id
 * Get specific mentor details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const mentorId = req.params.id;

    const mentor = await MentorProfile.findById(mentorId)
      .populate('userId', 'name email avatar');

    if (!mentor || !mentor.isActive || !mentor.isProfileComplete) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mentor not found or not available' 
      });
    }

    const mentorData = mentor.toObject();
    const availability = Object.fromEntries(mentorData.availability || new Map());
    
    // If no availability is set, generate default availability based on mentor ID
    const finalAvailability = Object.keys(availability).length === 0 
      ? generateDefaultAvailability(mentorData._id) 
      : availability;
    
    const mentorDetails = {
      id: mentorData._id,
      name: mentorData.userId.name,
      email: mentorData.userId.email,
      avatar: mentorData.userId.avatar || '',
      title: mentorData.title,
      company: mentorData.company,
      bio: mentorData.bio,
      experience: mentorData.experience,
      expertise: mentorData.expertise,
      yearsOfExperience: mentorData.yearsOfExperience,
      rating: mentorData.rating,
      totalSessions: mentorData.totalSessions,
      totalReviews: mentorData.totalReviews,
      linkedin: mentorData.linkedin,
      languages: mentorData.languages,
      timezone: mentorData.timezone,
      availability: finalAvailability,
      joinedDate: mentorData.createdAt
    };

    res.json({
      success: true,
      mentor: mentorDetails
    });
  } catch (error) {
    console.error('Error fetching mentor details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch mentor details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;