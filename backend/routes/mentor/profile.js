const express = require('express');
const { body, validationResult } = require('express-validator');
const { MentorProfile, MentorUser } = require('../../models/mentor');
const { mentorAuthMiddleware } = require('../../middleware/mentorAuthMiddleware');

const router = express.Router();

// Validation middleware
const profileValidation = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('company')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company must be between 2 and 100 characters'),
  body('bio')
    .trim()
    .isLength({ min: 50, max: 1000 })
    .withMessage('Bio must be between 50 and 1000 characters'),
  body('experience')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Experience must be between 10 and 2000 characters'),
  body('expertise')
    .isArray({ min: 1 })
    .withMessage('At least one expertise area is required'),
  body('expertise.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each expertise area must be between 1 and 50 characters'),
  body('yearsOfExperience')
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),
  body('linkedin')
    .optional()
    .matches(/^https?:\/\/(www\.)?linkedin\.com\/.*/)
    .withMessage('Please provide a valid LinkedIn URL'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Hourly rate must be between 0 and 10000'),
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
 * @route   GET /api/mentor/profile
 * @desc    Get mentor profile
 * @access  Private (Mentor only)
 */
router.get('/', mentorAuthMiddleware, async (req, res) => {
  try {
    console.log('=== GET MENTOR PROFILE ===');
    const mentorId = req.mentor.id;
    console.log('Fetching profile for mentor ID:', mentorId);

    let mentorProfile = await MentorProfile.findOne({ userId: mentorId })
      .populate('userId', 'name email avatar isActive');

    // If profile doesn't exist, create a default one
    if (!mentorProfile) {
      console.log('❌ Mentor profile not found for ID:', mentorId, '- Creating default profile');
      
      // Get the mentor user first
      const mentorUser = await MentorUser.findById(mentorId);
      if (!mentorUser) {
        return res.status(404).json({
          success: false,
          message: 'Mentor user not found'
        });
      }

      // Create default profile
      mentorProfile = new MentorProfile({
        userId: mentorId,
        title: '',
        company: '',
        bio: '',
        experience: '',
        expertise: [],
        linkedin: '',
        yearsOfExperience: 0,
        availability: new Map(),
        hourlyRate: 0,
        languages: ['English'],
        timezone: 'UTC',
        specializations: [],
        certifications: [],
        education: [],
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: true,
          sessionReminders: true
        },
        isActive: true,
        isProfileComplete: false
      });

      await mentorProfile.save();
      console.log('✅ Default profile created for mentor:', mentorId);

      // Populate the user data
      await mentorProfile.populate('userId', 'name email avatar isActive');
    }

    // Validate populated user data
    if (!mentorProfile.userId) {
      console.error('❌ Mentor profile found but user data not populated');
      return res.status(500).json({
        success: false,
        message: 'Profile data incomplete - user information missing'
      });
    }

    console.log('✅ Profile found for:', mentorProfile.userId.name);

    // Convert availability Map to Object for JSON response
    const profileData = mentorProfile.toObject();
    
    // Ensure availability is properly converted
    try {
      profileData.availability = Object.fromEntries(profileData.availability || new Map());
    } catch (availabilityError) {
      console.warn('⚠️ Error converting availability map:', availabilityError);
      profileData.availability = {};
    }

    // Ensure arrays are properly initialized
    profileData.expertise = profileData.expertise || [];
    profileData.languages = profileData.languages || ['English'];
    profileData.specializations = profileData.specializations || [];
    profileData.certifications = profileData.certifications || [];
    profileData.education = profileData.education || [];

    // Validate required fields
    const requiredFields = ['title', 'company', 'bio', 'experience'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Profile missing required fields:', missingFields);
    }

    const responseProfile = {
      id: profileData._id,
      userId: profileData.userId._id,
      name: profileData.userId.name,
      email: profileData.userId.email,
      avatar: profileData.userId.avatar || '',
      title: profileData.title || '',
      company: profileData.company || '',
      bio: profileData.bio || '',
      experience: profileData.experience || '',
      expertise: profileData.expertise,
      linkedin: profileData.linkedin || '',
      yearsOfExperience: profileData.yearsOfExperience || 0,
      availability: profileData.availability,
      hourlyRate: profileData.hourlyRate || 0,
      languages: profileData.languages,
      timezone: profileData.timezone || 'UTC',
      specializations: profileData.specializations,
      certifications: profileData.certifications,
      education: profileData.education,
      isProfileComplete: profileData.isProfileComplete || false,
      isActive: profileData.isActive !== false, // Default to true
      isVerified: profileData.isVerified || false,
      rating: profileData.rating || 0,
      totalSessions: profileData.totalSessions || 0,
      completedSessions: profileData.completedSessions || 0,
      totalReviews: profileData.totalReviews || 0,
      totalEarnings: profileData.totalEarnings || 0,
      responseTime: profileData.responseTime || 60,
      preferences: profileData.preferences || {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        sessionReminders: true
      },
      completionPercentage: profileData.completionPercentage || 0,
      createdAt: profileData.createdAt,
      updatedAt: profileData.updatedAt
    };

    console.log('✅ Profile data prepared successfully:', {
      id: responseProfile.id,
      name: responseProfile.name,
      title: responseProfile.title,
      company: responseProfile.company,
      expertiseCount: responseProfile.expertise.length,
      isComplete: responseProfile.isProfileComplete,
      completionPercentage: responseProfile.completionPercentage
    });

    res.json({
      success: true,
      profile: responseProfile
    });

  } catch (error) {
    console.error('Get mentor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentor profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/mentor/profile
 * @desc    Create mentor profile
 * @access  Private (Mentor only)
 */
router.post('/', mentorAuthMiddleware, profileValidation, handleValidationErrors, async (req, res) => {
  try {
    const mentorId = req.mentor.id;

    // Check if profile already exists
    const existingProfile = await MentorProfile.findOne({ userId: mentorId });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'Mentor profile already exists. Use PUT to update.'
      });
    }

    const {
      title,
      company,
      bio,
      experience,
      expertise,
      linkedin,
      yearsOfExperience,
      availability,
      hourlyRate,
      languages,
      timezone,
      specializations,
      certifications,
      education,
      preferences
    } = req.body;

    // Create new mentor profile
    const mentorProfile = new MentorProfile({
      userId: mentorId,
      title: title.trim(),
      company: company.trim(),
      bio: bio.trim(),
      experience: experience.trim(),
      expertise: expertise.map(item => item.trim()),
      linkedin: linkedin ? linkedin.trim() : '',
      yearsOfExperience: parseInt(yearsOfExperience) || 0,
      availability: availability || new Map(),
      hourlyRate: parseFloat(hourlyRate) || 0,
      languages: languages && Array.isArray(languages) ? languages : ['English'],
      timezone: timezone || 'UTC',
      specializations: specializations || [],
      certifications: certifications || [],
      education: education || [],
      preferences: preferences || {}
    });

    await mentorProfile.save();

    // Update user's name and avatar if provided in the profile
    const user = await MentorUser.findById(mentorId);
    if (req.body.name && req.body.name.trim() !== user.name) {
      user.name = req.body.name.trim();
    }
    if (req.body.avatar && req.body.avatar !== user.avatar) {
      user.avatar = req.body.avatar;
    }
    await user.save();

    // Populate user data for response
    await mentorProfile.populate('userId', 'name email avatar');
    
    const profileData = mentorProfile.toObject();
    profileData.availability = Object.fromEntries(profileData.availability || new Map());

    res.status(201).json({
      success: true,
      message: 'Mentor profile created successfully',
      profile: {
        id: profileData._id,
        userId: profileData.userId._id,
        name: profileData.userId.name,
        email: profileData.userId.email,
        avatar: profileData.userId.avatar || '',
        title: profileData.title,
        company: profileData.company,
        bio: profileData.bio,
        experience: profileData.experience,
        expertise: profileData.expertise,
        linkedin: profileData.linkedin,
        yearsOfExperience: profileData.yearsOfExperience,
        availability: profileData.availability,
        hourlyRate: profileData.hourlyRate,
        languages: profileData.languages,
        timezone: profileData.timezone,
        specializations: profileData.specializations,
        certifications: profileData.certifications,
        education: profileData.education,
        isProfileComplete: profileData.isProfileComplete,
        isActive: profileData.isActive,
        isVerified: profileData.isVerified,
        rating: profileData.rating,
        totalSessions: profileData.totalSessions,
        completedSessions: profileData.completedSessions,
        totalReviews: profileData.totalReviews,
        totalEarnings: profileData.totalEarnings,
        responseTime: profileData.responseTime,
        preferences: profileData.preferences,
        completionPercentage: profileData.completionPercentage,
        createdAt: profileData.createdAt,
        updatedAt: profileData.updatedAt
      }
    });

  } catch (error) {
    console.error('Create mentor profile error:', error);

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
      message: 'Failed to create mentor profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/mentor/profile
 * @desc    Update mentor profile
 * @access  Private (Mentor only)
 */
router.put('/', mentorAuthMiddleware, async (req, res) => {
  try {
    const mentorId = req.mentor.id;

    let mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    
    // If profile doesn't exist, create it
    if (!mentorProfile) {
      console.log('Profile not found, creating new profile for mentor:', mentorId);
      mentorProfile = new MentorProfile({
        userId: mentorId,
        title: '',
        company: '',
        bio: '',
        experience: '',
        expertise: [],
        linkedin: '',
        yearsOfExperience: 0,
        availability: new Map(),
        hourlyRate: 0,
        languages: ['English'],
        timezone: 'UTC',
        specializations: [],
        certifications: [],
        education: [],
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: true,
          sessionReminders: true
        },
        isActive: true,
        isProfileComplete: false
      });
    }

    const {
      title,
      company,
      bio,
      experience,
      expertise,
      linkedin,
      yearsOfExperience,
      availability,
      hourlyRate,
      languages,
      timezone,
      specializations,
      certifications,
      education,
      preferences,
      isActive,
      avatar
    } = req.body;

    // Update fields if provided
    if (title !== undefined) mentorProfile.title = title.trim();
    if (company !== undefined) mentorProfile.company = company.trim();
    if (bio !== undefined) mentorProfile.bio = bio.trim();
    if (experience !== undefined) mentorProfile.experience = experience.trim();
    if (expertise !== undefined) mentorProfile.expertise = expertise.map(item => item.trim());
    if (linkedin !== undefined) mentorProfile.linkedin = linkedin.trim();
    if (yearsOfExperience !== undefined) mentorProfile.yearsOfExperience = parseInt(yearsOfExperience) || 0;
    if (availability) mentorProfile.availability = availability;
    if (hourlyRate !== undefined) mentorProfile.hourlyRate = parseFloat(hourlyRate) || 0;
    if (languages && Array.isArray(languages)) mentorProfile.languages = languages;
    if (timezone !== undefined) mentorProfile.timezone = timezone;
    if (specializations !== undefined) mentorProfile.specializations = specializations;
    if (certifications !== undefined) mentorProfile.certifications = certifications;
    if (education !== undefined) mentorProfile.education = education;
    if (preferences !== undefined) mentorProfile.preferences = { ...mentorProfile.preferences, ...preferences };
    if (isActive !== undefined) mentorProfile.isActive = isActive;

    await mentorProfile.save();

    // Update user's name and avatar if provided
    const user = await MentorUser.findById(mentorId);
    if (req.body.name && req.body.name.trim() !== user.name) {
      user.name = req.body.name.trim();
    }
    if (avatar !== undefined && avatar !== user.avatar) {
      user.avatar = avatar;
    }
    await user.save();

    // Sync profile to main database so mentees can see it
    try {
      const MainMentorProfile = require('../../models/MentorProfile');
      const MainUser = require('../../models/User');
      
      // Find or create user in main database
      let mainUser = await MainUser.findOne({ email: user.email });
      if (!mainUser) {
        mainUser = new MainUser({
          name: user.name,
          email: user.email,
          password: 'synced_from_mentor_db',
          role: 'mentor',
          avatar: user.avatar || ''
        });
        await mainUser.save();
      } else {
        // Update main user data
        mainUser.name = user.name;
        mainUser.avatar = user.avatar || '';
        await mainUser.save();
      }

      // Find or create mentor profile in main database
      let mainMentorProfile = await MainMentorProfile.findOne({ userId: mainUser._id });
      if (!mainMentorProfile) {
        mainMentorProfile = new MainMentorProfile({
          userId: mainUser._id,
          title: mentorProfile.title,
          company: mentorProfile.company,
          bio: mentorProfile.bio,
          experience: mentorProfile.experience,
          expertise: mentorProfile.expertise,
          linkedin: mentorProfile.linkedin,
          yearsOfExperience: mentorProfile.yearsOfExperience,
          availability: mentorProfile.availability,
          hourlyRate: mentorProfile.hourlyRate,
          languages: mentorProfile.languages,
          timezone: mentorProfile.timezone,
          isActive: mentorProfile.isActive,
          isProfileComplete: true
        });
      } else {
        // Update existing profile
        mainMentorProfile.title = mentorProfile.title;
        mainMentorProfile.company = mentorProfile.company;
        mainMentorProfile.bio = mentorProfile.bio;
        mainMentorProfile.experience = mentorProfile.experience;
        mainMentorProfile.expertise = mentorProfile.expertise;
        mainMentorProfile.linkedin = mentorProfile.linkedin;
        mainMentorProfile.yearsOfExperience = mentorProfile.yearsOfExperience;
        mainMentorProfile.availability = mentorProfile.availability;
        mainMentorProfile.hourlyRate = mentorProfile.hourlyRate;
        mainMentorProfile.languages = mentorProfile.languages;
        mainMentorProfile.timezone = mentorProfile.timezone;
        mainMentorProfile.isActive = mentorProfile.isActive;
        mainMentorProfile.isProfileComplete = true;
      }
      await mainMentorProfile.save();
      
      console.log('✅ Mentor profile synced to main database for mentee visibility');
    } catch (syncError) {
      console.error('❌ Failed to sync mentor profile to main database:', syncError);
      // Don't fail the request if sync fails, just log the error
    }

    // Populate user data for response
    await mentorProfile.populate('userId', 'name email avatar');
    
    const profileData = mentorProfile.toObject();
    profileData.availability = Object.fromEntries(profileData.availability || new Map());

    res.json({
      success: true,
      message: 'Mentor profile updated successfully',
      profile: {
        id: profileData._id,
        userId: profileData.userId._id,
        name: profileData.userId.name,
        email: profileData.userId.email,
        avatar: profileData.userId.avatar || '',
        title: profileData.title,
        company: profileData.company,
        bio: profileData.bio,
        experience: profileData.experience,
        expertise: profileData.expertise,
        linkedin: profileData.linkedin,
        yearsOfExperience: profileData.yearsOfExperience,
        availability: profileData.availability,
        hourlyRate: profileData.hourlyRate,
        languages: profileData.languages,
        timezone: profileData.timezone,
        specializations: profileData.specializations,
        certifications: profileData.certifications,
        education: profileData.education,
        isProfileComplete: profileData.isProfileComplete,
        isActive: profileData.isActive,
        isVerified: profileData.isVerified,
        rating: profileData.rating,
        totalSessions: profileData.totalSessions,
        completedSessions: profileData.completedSessions,
        totalReviews: profileData.totalReviews,
        totalEarnings: profileData.totalEarnings,
        responseTime: profileData.responseTime,
        preferences: profileData.preferences,
        completionPercentage: profileData.completionPercentage,
        createdAt: profileData.createdAt,
        updatedAt: profileData.updatedAt
      }
    });

  } catch (error) {
    console.error('Update mentor profile error:', error);

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
      message: 'Failed to update mentor profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/mentor/profile
 * @desc    Delete mentor profile (deactivate)
 * @access  Private (Mentor only)
 */
router.delete('/', mentorAuthMiddleware, async (req, res) => {
  try {
    const mentorId = req.mentor.id;

    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    // Soft delete - deactivate instead of removing
    mentorProfile.isActive = false;
    await mentorProfile.save();

    // Also deactivate user account
    const user = await MentorUser.findById(mentorId);
    if (user) {
      user.isActive = false;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Mentor profile deactivated successfully'
    });

  } catch (error) {
    console.error('Delete mentor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate mentor profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentor/profile/check
 * @desc    Check if mentor profile exists and is complete
 * @access  Private (Mentor only)
 */
router.get('/check', mentorAuthMiddleware, async (req, res) => {
  try {
    console.log('=== CHECK MENTOR PROFILE ===');
    const mentorId = req.mentor.id;
    console.log('Checking profile for mentor ID:', mentorId);

    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });

    if (!mentorProfile) {
      console.log('❌ No profile found for mentor ID:', mentorId);
      return res.json({
        success: true,
        exists: false,
        isComplete: false,
        profileId: null,
        completionPercentage: 0
      });
    }

    console.log('✅ Profile found:', {
      id: mentorProfile._id,
      isComplete: mentorProfile.isProfileComplete,
      completionPercentage: mentorProfile.completionPercentage
    });

    res.json({
      success: true,
      exists: true,
      isComplete: mentorProfile.isProfileComplete,
      profileId: mentorProfile._id,
      completionPercentage: mentorProfile.completionPercentage
    });

  } catch (error) {
    console.error('❌ Check mentor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check mentor profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/mentor/profile/availability
 * @desc    Update mentor availability
 * @access  Private (Mentor only)
 */
router.put('/availability', mentorAuthMiddleware, [
  body('availability')
    .isObject()
    .withMessage('Availability must be an object with date keys and time slot arrays')
], handleValidationErrors, async (req, res) => {
  try {
    const mentorId = req.mentor.id;
    const { availability } = req.body;

    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    // Validate availability format
    for (const [date, slots] of Object.entries(availability)) {
      if (!Array.isArray(slots)) {
        return res.status(400).json({
          success: false,
          message: `Availability for ${date} must be an array of time slots`
        });
      }
      
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: `Invalid date format: ${date}. Use YYYY-MM-DD format.`
        });
      }
    }

    mentorProfile.availability = availability;
    await mentorProfile.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      availability: Object.fromEntries(mentorProfile.availability)
    });

  } catch (error) {
    console.error('Update mentor availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/mentor/profile/create-from-main
 * Create mentor profile using main auth token
 * This endpoint accepts main auth tokens and creates both mentor user and profile
 */
router.post('/create-from-main', async (req, res) => {
  try {
    console.log('=== CREATE MENTOR PROFILE FROM MAIN ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request headers:', req.headers.authorization ? 'Token present' : 'No token');

    // Verify main auth token using same logic as main auth middleware
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing'
      });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      console.log('❌ Invalid authorization header format');
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header'
      });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.userId);
    } catch (error) {
      console.error('❌ JWT verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Get user data from request body (passed from frontend)
    const { userData } = req.body;
    if (!userData || !userData.name || !userData.email || !userData.id) {
      console.log('❌ Missing user data:', userData);
      return res.status(400).json({
        success: false,
        message: 'User data (name, email, id) is required'
      });
    }

    // Verify the token user ID matches the provided user data
    if (decoded.userId !== userData.id) {
      console.log('❌ Token user ID mismatch:', decoded.userId, 'vs', userData.id);
      return res.status(403).json({
        success: false,
        message: 'Token user ID does not match provided user data'
      });
    }

    console.log('✅ User data validated:', userData.email);

    // Check if mentor already exists in mentor database
    let mentorUser = await MentorUser.findOne({ email: userData.email });
    
    if (!mentorUser) {
      console.log('Creating new mentor user in mentor database...');
      // Create mentor user in mentor database
      mentorUser = new MentorUser({
        name: userData.name,
        email: userData.email,
        password: 'migrated_user_' + Date.now(),
        role: 'mentor',
        isActive: true,
        isEmailVerified: true,
        mainUserId: userData.id,
        migratedAt: new Date()
      });
      await mentorUser.save();
      console.log('✅ Mentor user created:', mentorUser._id);
    } else {
      console.log('✅ Mentor user already exists:', mentorUser._id);
    }

    // Validate profile data
    console.log('Validating profile data...');
    const validationErrors = [];
    
    // Title validation
    if (!req.body.title || typeof req.body.title !== 'string') {
      validationErrors.push({ field: 'title', message: 'Title is required' });
    } else if (req.body.title.trim().length < 2) {
      validationErrors.push({ field: 'title', message: 'Title must be at least 2 characters' });
    } else if (req.body.title.trim().length > 100) {
      validationErrors.push({ field: 'title', message: 'Title cannot exceed 100 characters' });
    }
    
    // Company validation
    if (!req.body.company || typeof req.body.company !== 'string') {
      validationErrors.push({ field: 'company', message: 'Company is required' });
    } else if (req.body.company.trim().length < 2) {
      validationErrors.push({ field: 'company', message: 'Company must be at least 2 characters' });
    } else if (req.body.company.trim().length > 100) {
      validationErrors.push({ field: 'company', message: 'Company cannot exceed 100 characters' });
    }
    
    // Bio validation
    if (!req.body.bio || typeof req.body.bio !== 'string') {
      validationErrors.push({ field: 'bio', message: 'Bio is required' });
    } else if (req.body.bio.trim().length < 50) {
      validationErrors.push({ field: 'bio', message: 'Bio must be at least 50 characters' });
    } else if (req.body.bio.trim().length > 1000) {
      validationErrors.push({ field: 'bio', message: 'Bio cannot exceed 1000 characters' });
    }
    
    // Experience validation
    if (!req.body.experience || typeof req.body.experience !== 'string') {
      validationErrors.push({ field: 'experience', message: 'Experience is required' });
    } else if (req.body.experience.trim().length < 10) {
      validationErrors.push({ field: 'experience', message: 'Experience must be at least 10 characters' });
    } else if (req.body.experience.trim().length > 2000) {
      validationErrors.push({ field: 'experience', message: 'Experience cannot exceed 2000 characters' });
    }
    
    // Expertise validation
    if (!req.body.expertise || !Array.isArray(req.body.expertise) || req.body.expertise.length === 0) {
      validationErrors.push({ field: 'expertise', message: 'At least one expertise area is required' });
    } else {
      // Validate each expertise item
      req.body.expertise.forEach((item, index) => {
        if (!item || typeof item !== 'string' || item.trim().length === 0) {
          validationErrors.push({ field: `expertise[${index}]`, message: 'Expertise area cannot be empty' });
        } else if (item.trim().length > 50) {
          validationErrors.push({ field: `expertise[${index}]`, message: 'Expertise area cannot exceed 50 characters' });
        }
      });
    }
    
    // LinkedIn validation (optional)
    if (req.body.linkedin && req.body.linkedin.trim()) {
      if (!req.body.linkedin.match(/^https?:\/\/(www\.)?linkedin\.com\/.*/)) {
        validationErrors.push({ field: 'linkedin', message: 'Please provide a valid LinkedIn URL' });
      }
    }
    
    // Years of experience validation
    if (req.body.yearsOfExperience !== undefined && req.body.yearsOfExperience !== null) {
      const years = parseInt(req.body.yearsOfExperience);
      if (isNaN(years) || years < 0 || years > 50) {
        validationErrors.push({ field: 'yearsOfExperience', message: 'Years of experience must be between 0 and 50' });
      }
    }
    
    if (validationErrors.length > 0) {
      console.log('❌ Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    console.log('✅ Profile data validation passed');

    // Check if profile already exists
    const existingProfile = await MentorProfile.findOne({ userId: mentorUser._id });
    if (existingProfile) {
      console.log('❌ Profile already exists for user:', mentorUser._id);
      return res.status(409).json({
        success: false,
        message: 'Mentor profile already exists. Use the update endpoint to modify it.'
      });
    }

    // Create mentor profile
    console.log('Creating mentor profile...');
    const profileData = {
      userId: mentorUser._id,
      title: req.body.title.trim(),
      company: req.body.company.trim(),
      bio: req.body.bio.trim(),
      experience: req.body.experience.trim(),
      expertise: req.body.expertise.map(e => e.trim()),
      yearsOfExperience: parseInt(req.body.yearsOfExperience) || 0,
      linkedin: req.body.linkedin ? req.body.linkedin.trim() : '',
      hourlyRate: parseFloat(req.body.hourlyRate) || 0,
      languages: Array.isArray(req.body.languages) ? req.body.languages : ['English'],
      timezone: req.body.timezone ? req.body.timezone.trim() : 'UTC',
      availability: req.body.availability || new Map(),
      isActive: true,
      isProfileComplete: true
    };

    const mentorProfile = new MentorProfile(profileData);
    await mentorProfile.save();
    console.log('✅ Mentor profile created:', mentorProfile._id);

    // Update mentor user name if provided
    if (req.body.name && req.body.name.trim() !== mentorUser.name) {
      mentorUser.name = req.body.name.trim();
      await mentorUser.save();
      console.log('✅ Mentor user name updated');
    }

    // Sync profile to main database so mentees can see it
    try {
      const MainMentorProfile = require('../../models/MentorProfile');
      const MainUser = require('../../models/User');
      
      // Find or create user in main database
      let mainUser = await MainUser.findOne({ email: mentorUser.email });
      if (!mainUser) {
        mainUser = new MainUser({
          name: mentorUser.name,
          email: mentorUser.email,
          password: 'synced_from_mentor_db',
          role: 'mentor',
          avatar: mentorUser.avatar || ''
        });
        await mainUser.save();
      } else {
        // Update main user data
        mainUser.name = mentorUser.name;
        mainUser.avatar = mentorUser.avatar || '';
        await mainUser.save();
      }

      // Create mentor profile in main database
      const mainMentorProfile = new MainMentorProfile({
        userId: mainUser._id,
        title: mentorProfile.title,
        company: mentorProfile.company,
        bio: mentorProfile.bio,
        experience: mentorProfile.experience,
        expertise: mentorProfile.expertise,
        linkedin: mentorProfile.linkedin,
        yearsOfExperience: mentorProfile.yearsOfExperience,
        availability: mentorProfile.availability,
        hourlyRate: mentorProfile.hourlyRate,
        languages: mentorProfile.languages,
        timezone: mentorProfile.timezone,
        isActive: true,
        isProfileComplete: true
      });
      await mainMentorProfile.save();
      
      console.log('✅ Mentor profile synced to main database for mentee visibility');
    } catch (syncError) {
      console.error('❌ Failed to sync mentor profile to main database:', syncError);
      // Don't fail the request if sync fails, just log the error
    }

    // Populate user data for response
    await mentorProfile.populate('userId', 'name email avatar');

    // Transform response
    const responseProfile = {
      id: mentorProfile._id,
      userId: mentorProfile.userId._id,
      name: mentorProfile.userId.name,
      email: mentorProfile.userId.email,
      role: 'mentor',
      title: mentorProfile.title,
      company: mentorProfile.company,
      bio: mentorProfile.bio,
      experience: mentorProfile.experience,
      expertise: mentorProfile.expertise,
      linkedin: mentorProfile.linkedin,
      avatar: mentorProfile.userId.avatar || '',
      yearsOfExperience: mentorProfile.yearsOfExperience,
      hourlyRate: mentorProfile.hourlyRate,
      languages: mentorProfile.languages,
      timezone: mentorProfile.timezone,
      availability: Object.fromEntries(mentorProfile.availability || new Map()),
      isActive: mentorProfile.isActive,
      isProfileComplete: mentorProfile.isProfileComplete,
      createdAt: mentorProfile.createdAt,
      updatedAt: mentorProfile.updatedAt
    };

    console.log('✅ Profile creation successful');
    res.status(201).json({
      success: true,
      message: 'Mentor profile created successfully',
      profile: responseProfile
    });

  } catch (error) {
    console.error('❌ Create mentor profile from main error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mentor profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;