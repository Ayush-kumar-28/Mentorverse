const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role college course profile');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Profile fetched for user ${user.email}`);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college || '',
        course: user.course || '',
        title: user.profile?.title || '',
        skills: user.profile?.skills || [],
        bio: user.profile?.bio || '',
        experience: user.profile?.experience || '',
        interests: user.profile?.interests || [],
        avatar: user.profile?.avatar || '',
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put(
  '/',
  authMiddleware,
  [
    body('name').optional().isString().trim().notEmpty().withMessage('Name must be a non-empty string'),
    body('email').optional().isEmail().withMessage('Email must be valid'),
    body('title').optional().isString().trim(),
    body('bio').optional().isString().trim(),
    body('experience').optional().isString().trim(),
    body('college').optional().isString().trim(),
    body('course').optional().isString().trim(),
    body('skills').optional(),
    body('interests').optional(),
    body('avatar').optional().isString().withMessage('Avatar must be a string (URL or base64)'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Profile update validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updates = {};
      const logParts = [];

      if (req.body.name) {
        updates.name = req.body.name.trim();
        logParts.push(`name -> ${updates.name}`);
      }

      if (req.body.email) {
        updates.email = req.body.email.trim().toLowerCase();
        logParts.push(`email -> ${updates.email}`);
      }

      if (req.body.college !== undefined) {
        updates.college = req.body.college.trim();
        logParts.push(`college -> ${updates.college}`);
      }

      if (req.body.course !== undefined) {
        updates.course = req.body.course.trim();
        logParts.push(`course -> ${updates.course}`);
      }

      const profileUpdates = { ...user.profile };

      if (req.body.title !== undefined) {
        profileUpdates.title = req.body.title.trim();
        logParts.push(`title -> ${profileUpdates.title}`);
      }

      if (req.body.skills !== undefined) {
        const rawSkills = Array.isArray(req.body.skills)
          ? req.body.skills
          : req.body.skills
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean);
        profileUpdates.skills = rawSkills;
        logParts.push(`skills -> [${rawSkills.join(', ')}]`);
      }

      if (req.body.bio !== undefined) {
        profileUpdates.bio = req.body.bio.trim();
        logParts.push(`bio -> ${profileUpdates.bio}`);
      }

      if (req.body.experience !== undefined) {
        profileUpdates.experience = req.body.experience.trim();
        logParts.push(`experience -> ${profileUpdates.experience}`);
      }

      if (req.body.interests !== undefined) {
        const rawInterests = Array.isArray(req.body.interests)
          ? req.body.interests
          : req.body.interests
              .split(',')
              .map((interest) => interest.trim())
              .filter(Boolean);
        profileUpdates.interests = rawInterests;
        logParts.push(`interests -> [${rawInterests.join(', ')}]`);
      }

      if (req.body.avatar !== undefined) {
        // Don't trim avatar as it might be a base64 string
        profileUpdates.avatar = req.body.avatar;
        const avatarPreview = req.body.avatar.startsWith('data:image')
          ? 'base64 image'
          : req.body.avatar.substring(0, 50);
        logParts.push(`avatar -> ${avatarPreview}`);
      }

      user.set({ ...updates, profile: profileUpdates });
      await user.save();

      console.log(`Profile updated for ${user.email}: ${logParts.join('; ')}`);

      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          college: user.college || '',
          course: user.course || '',
          title: user.profile?.title || '',
          bio: user.profile?.bio || '',
          experience: user.profile?.experience || '',
          interests: user.profile?.interests || [],
          skills: user.profile?.skills || [],
          avatar: user.profile?.avatar || '',
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;