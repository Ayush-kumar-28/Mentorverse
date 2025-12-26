const express = require('express');
const { body, validationResult } = require('express-validator');
const { MenteeProfile, MenteeUser } = require('../../models/mentee');
const { menteeAuthMiddleware } = require('../../middleware/menteeAuthMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(menteeAuthMiddleware);

// Validation middleware
const profileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  body('currentRole')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Current role cannot exceed 100 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),
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
 * @route   GET /api/mentee/profile
 * @desc    Get mentee profile
 * @access  Private (Mentee only)
 */
router.get('/', async (req, res) => {
  try {
    const menteeId = req.mentee.id;

    const menteeProfile = await MenteeProfile.findOne({ userId: menteeId })
      .populate('userId', 'name email avatar isActive');

    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentee profile not found'
      });
    }

    res.json({
      success: true,
      profile: {
        id: menteeProfile._id,
        userId: menteeProfile.userId._id,
        name: menteeProfile.userId.name,
        email: menteeProfile.userId.email,
        avatar: menteeProfile.userId.avatar || '',
        firstName: menteeProfile.firstName,
        lastName: menteeProfile.lastName,
        fullName: menteeProfile.fullName,
        dateOfBirth: menteeProfile.dateOfBirth,
        age: menteeProfile.age,
        gender: menteeProfile.gender,
        phoneNumber: menteeProfile.phoneNumber,
        location: menteeProfile.location,
        currentRole: menteeProfile.currentRole,
        company: menteeProfile.company,
        industry: menteeProfile.industry,
        experienceLevel: menteeProfile.experienceLevel,
        yearsOfExperience: menteeProfile.yearsOfExperience,
        education: menteeProfile.education,
        skills: menteeProfile.skills,
        interests: menteeProfile.interests,
        careerGoals: menteeProfile.careerGoals,
        mentorshipPreferences: menteeProfile.mentorshipPreferences,
        bio: menteeProfile.bio,
        socialLinks: menteeProfile.socialLinks,
        isProfileComplete: menteeProfile.isProfileComplete,
        completionPercentage: menteeProfile.completionPercentage,
        isActive: menteeProfile.isActive,
        totalSessions: menteeProfile.totalSessions,
        completedSessions: menteeProfile.completedSessions,
        cancelledSessions: menteeProfile.cancelledSessions,
        totalSpent: menteeProfile.totalSpent,
        averageRating: menteeProfile.averageRating,
        totalReviews: menteeProfile.totalReviews,
        favoriteMentors: menteeProfile.favoriteMentors,
        learningPath: menteeProfile.learningPath,
        preferences: menteeProfile.preferences,
        createdAt: menteeProfile.createdAt,
        updatedAt: menteeProfile.updatedAt
      }
    });

  } catch (error) {
    console.error('Get mentee profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentee profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/mentee/profile
 * @desc    Create mentee profile
 * @access  Private (Mentee only)
 */
router.post('/', profileValidation, handleValidationErrors, async (req, res) => {
  try {
    const menteeId = req.mentee.id;

    // Check if profile already exists
    const existingProfile = await MenteeProfile.findOne({ userId: menteeId });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'Mentee profile already exists. Use PUT to update.'
      });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      location,
      currentRole,
      company,
      industry,
      experienceLevel,
      yearsOfExperience,
      education,
      skills,
      interests,
      careerGoals,
      mentorshipPreferences,
      bio,
      socialLinks,
      learningPath,
      preferences
    } = req.body;

    // Create new mentee profile
    const menteeProfile = new MenteeProfile({
      userId: menteeId,
      firstName: firstName ? firstName.trim() : '',
      lastName: lastName ? lastName.trim() : '',
      dateOfBirth,
      gender,
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      location: location || {},
      currentRole: currentRole ? currentRole.trim() : '',
      company: company ? company.trim() : '',
      industry: industry ? industry.trim() : '',
      experienceLevel: experienceLevel || 'student',
      yearsOfExperience: parseInt(yearsOfExperience) || 0,
      education: education || [],
      skills: skills || [],
      interests: interests || [],
      careerGoals: careerGoals || { shortTerm: [], longTerm: [] },
      mentorshipPreferences: mentorshipPreferences || {},
      bio: bio ? bio.trim() : '',
      socialLinks: socialLinks || {},
      learningPath: learningPath || {},
      preferences: preferences || {}
    });

    await menteeProfile.save();

    // Update user's name and avatar if provided in the profile
    const user = await MenteeUser.findById(menteeId);
    if (req.body.name && req.body.name.trim() !== user.name) {
      user.name = req.body.name.trim();
    }
    if (req.body.avatar && req.body.avatar !== user.avatar) {
      user.avatar = req.body.avatar;
    }
    await user.save();

    // Populate user data for response
    await menteeProfile.populate('userId', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Mentee profile created successfully',
      profile: {
        id: menteeProfile._id,
        userId: menteeProfile.userId._id,
        name: menteeProfile.userId.name,
        email: menteeProfile.userId.email,
        avatar: menteeProfile.userId.avatar || '',
        firstName: menteeProfile.firstName,
        lastName: menteeProfile.lastName,
        fullName: menteeProfile.fullName,
        dateOfBirth: menteeProfile.dateOfBirth,
        age: menteeProfile.age,
        gender: menteeProfile.gender,
        phoneNumber: menteeProfile.phoneNumber,
        location: menteeProfile.location,
        currentRole: menteeProfile.currentRole,
        company: menteeProfile.company,
        industry: menteeProfile.industry,
        experienceLevel: menteeProfile.experienceLevel,
        yearsOfExperience: menteeProfile.yearsOfExperience,
        education: menteeProfile.education,
        skills: menteeProfile.skills,
        interests: menteeProfile.interests,
        careerGoals: menteeProfile.careerGoals,
        mentorshipPreferences: menteeProfile.mentorshipPreferences,
        bio: menteeProfile.bio,
        socialLinks: menteeProfile.socialLinks,
        isProfileComplete: menteeProfile.isProfileComplete,
        completionPercentage: menteeProfile.completionPercentage,
        isActive: menteeProfile.isActive,
        totalSessions: menteeProfile.totalSessions,
        completedSessions: menteeProfile.completedSessions,
        cancelledSessions: menteeProfile.cancelledSessions,
        totalSpent: menteeProfile.totalSpent,
        averageRating: menteeProfile.averageRating,
        totalReviews: menteeProfile.totalReviews,
        favoriteMentors: menteeProfile.favoriteMentors,
        learningPath: menteeProfile.learningPath,
        preferences: menteeProfile.preferences,
        createdAt: menteeProfile.createdAt,
        updatedAt: menteeProfile.updatedAt
      }
    });

  } catch (error) {
    console.error('Create mentee profile error:', error);

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
      message: 'Failed to create mentee profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/mentee/profile
 * @desc    Update mentee profile
 * @access  Private (Mentee only)
 */
router.put('/', async (req, res) => {
  try {
    const menteeId = req.mentee.id;

    const menteeProfile = await MenteeProfile.findOne({ userId: menteeId });
    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentee profile not found. Please create your profile first.'
      });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      location,
      currentRole,
      company,
      industry,
      experienceLevel,
      yearsOfExperience,
      education,
      skills,
      interests,
      careerGoals,
      mentorshipPreferences,
      bio,
      socialLinks,
      learningPath,
      preferences,
      isActive,
      avatar
    } = req.body;

    // Update fields if provided
    if (firstName !== undefined) menteeProfile.firstName = firstName.trim();
    if (lastName !== undefined) menteeProfile.lastName = lastName.trim();
    if (dateOfBirth !== undefined) menteeProfile.dateOfBirth = dateOfBirth;
    if (gender !== undefined) menteeProfile.gender = gender;
    if (phoneNumber !== undefined) menteeProfile.phoneNumber = phoneNumber.trim();
    if (location !== undefined) menteeProfile.location = { ...menteeProfile.location, ...location };
    if (currentRole !== undefined) menteeProfile.currentRole = currentRole.trim();
    if (company !== undefined) menteeProfile.company = company.trim();
    if (industry !== undefined) menteeProfile.industry = industry.trim();
    if (experienceLevel !== undefined) menteeProfile.experienceLevel = experienceLevel;
    if (yearsOfExperience !== undefined) menteeProfile.yearsOfExperience = parseInt(yearsOfExperience) || 0;
    if (education !== undefined) menteeProfile.education = education;
    if (skills !== undefined) menteeProfile.skills = skills;
    if (interests !== undefined) menteeProfile.interests = interests;
    if (careerGoals !== undefined) menteeProfile.careerGoals = { ...menteeProfile.careerGoals, ...careerGoals };
    if (mentorshipPreferences !== undefined) menteeProfile.mentorshipPreferences = { ...menteeProfile.mentorshipPreferences, ...mentorshipPreferences };
    if (bio !== undefined) menteeProfile.bio = bio.trim();
    if (socialLinks !== undefined) menteeProfile.socialLinks = { ...menteeProfile.socialLinks, ...socialLinks };
    if (learningPath !== undefined) menteeProfile.learningPath = { ...menteeProfile.learningPath, ...learningPath };
    if (preferences !== undefined) menteeProfile.preferences = { ...menteeProfile.preferences, ...preferences };
    if (isActive !== undefined) menteeProfile.isActive = isActive;

    await menteeProfile.save();

    // Update user's name and avatar if provided
    const user = await MenteeUser.findById(menteeId);
    if (req.body.name && req.body.name.trim() !== user.name) {
      user.name = req.body.name.trim();
    }
    if (avatar !== undefined && avatar !== user.avatar) {
      user.avatar = avatar;
    }
    await user.save();

    // Populate user data for response
    await menteeProfile.populate('userId', 'name email avatar');

    res.json({
      success: true,
      message: 'Mentee profile updated successfully',
      profile: {
        id: menteeProfile._id,
        userId: menteeProfile.userId._id,
        name: menteeProfile.userId.name,
        email: menteeProfile.userId.email,
        avatar: menteeProfile.userId.avatar || '',
        firstName: menteeProfile.firstName,
        lastName: menteeProfile.lastName,
        fullName: menteeProfile.fullName,
        dateOfBirth: menteeProfile.dateOfBirth,
        age: menteeProfile.age,
        gender: menteeProfile.gender,
        phoneNumber: menteeProfile.phoneNumber,
        location: menteeProfile.location,
        currentRole: menteeProfile.currentRole,
        company: menteeProfile.company,
        industry: menteeProfile.industry,
        experienceLevel: menteeProfile.experienceLevel,
        yearsOfExperience: menteeProfile.yearsOfExperience,
        education: menteeProfile.education,
        skills: menteeProfile.skills,
        interests: menteeProfile.interests,
        careerGoals: menteeProfile.careerGoals,
        mentorshipPreferences: menteeProfile.mentorshipPreferences,
        bio: menteeProfile.bio,
        socialLinks: menteeProfile.socialLinks,
        isProfileComplete: menteeProfile.isProfileComplete,
        completionPercentage: menteeProfile.completionPercentage,
        isActive: menteeProfile.isActive,
        totalSessions: menteeProfile.totalSessions,
        completedSessions: menteeProfile.completedSessions,
        cancelledSessions: menteeProfile.cancelledSessions,
        totalSpent: menteeProfile.totalSpent,
        averageRating: menteeProfile.averageRating,
        totalReviews: menteeProfile.totalReviews,
        favoriteMentors: menteeProfile.favoriteMentors,
        learningPath: menteeProfile.learningPath,
        preferences: menteeProfile.preferences,
        createdAt: menteeProfile.createdAt,
        updatedAt: menteeProfile.updatedAt
      }
    });

  } catch (error) {
    console.error('Update mentee profile error:', error);

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
      message: 'Failed to update mentee profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/mentee/profile
 * @desc    Delete mentee profile (deactivate)
 * @access  Private (Mentee only)
 */
router.delete('/', async (req, res) => {
  try {
    const menteeId = req.mentee.id;

    const menteeProfile = await MenteeProfile.findOne({ userId: menteeId });
    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentee profile not found'
      });
    }

    // Soft delete - deactivate instead of removing
    menteeProfile.isActive = false;
    await menteeProfile.save();

    // Also deactivate user account
    const user = await MenteeUser.findById(menteeId);
    if (user) {
      user.isActive = false;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Mentee profile deactivated successfully'
    });

  } catch (error) {
    console.error('Delete mentee profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate mentee profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/mentee/profile/check
 * @desc    Check if mentee profile exists and is complete
 * @access  Private (Mentee only)
 */
router.get('/check', async (req, res) => {
  try {
    const menteeId = req.mentee.id;

    const menteeProfile = await MenteeProfile.findOne({ userId: menteeId });

    if (!menteeProfile) {
      return res.json({
        success: true,
        exists: false,
        isComplete: false,
        profileId: null,
        completionPercentage: 0
      });
    }

    res.json({
      success: true,
      exists: true,
      isComplete: menteeProfile.isProfileComplete,
      profileId: menteeProfile._id,
      completionPercentage: menteeProfile.completionPercentage
    });

  } catch (error) {
    console.error('Check mentee profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check mentee profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/mentee/profile/favorites/:mentorId
 * @desc    Add mentor to favorites
 * @access  Private (Mentee only)
 */
router.post('/favorites/:mentorId', async (req, res) => {
  try {
    const menteeId = req.mentee.id;
    const { mentorId } = req.params;

    const menteeProfile = await MenteeProfile.findOne({ userId: menteeId });
    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentee profile not found'
      });
    }

    await menteeProfile.addFavoriteMentor(mentorId);

    res.json({
      success: true,
      message: 'Mentor added to favorites successfully',
      favoriteMentors: menteeProfile.favoriteMentors
    });

  } catch (error) {
    console.error('Add favorite mentor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add mentor to favorites',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/mentee/profile/favorites/:mentorId
 * @desc    Remove mentor from favorites
 * @access  Private (Mentee only)
 */
router.delete('/favorites/:mentorId', async (req, res) => {
  try {
    const menteeId = req.mentee.id;
    const { mentorId } = req.params;

    const menteeProfile = await MenteeProfile.findOne({ userId: menteeId });
    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentee profile not found'
      });
    }

    await menteeProfile.removeFavoriteMentor(mentorId);

    res.json({
      success: true,
      message: 'Mentor removed from favorites successfully',
      favoriteMentors: menteeProfile.favoriteMentors
    });

  } catch (error) {
    console.error('Remove favorite mentor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove mentor from favorites',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;