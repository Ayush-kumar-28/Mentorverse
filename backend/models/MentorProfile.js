const mongoose = require('mongoose');

// Basic MentorProfile model for main database (backward compatibility)
// This is a simplified version for the main application
// The comprehensive mentor system uses separate database models
const mentorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: String,
    required: true,
    trim: true
  },
  expertise: [{
    type: String,
    required: true,
    trim: true
  }],
  linkedin: {
    type: String,
    trim: true,
    default: ''
  },
  yearsOfExperience: {
    type: Number,
    required: true,
    min: 0
  },
  availability: {
    type: Map,
    of: [String],
    default: new Map()
  },
  hourlyRate: {
    type: Number,
    default: 0,
    min: 0
  },
  languages: [{
    type: String,
    default: 'English'
  }],
  timezone: {
    type: String,
    default: 'UTC'
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  completedSessions: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Convert availability Map to Object for JSON response
      if (ret.availability instanceof Map) {
        ret.availability = Object.fromEntries(ret.availability);
      }
      return ret;
    }
  }
});

// Pre-save middleware to calculate profile completeness
mentorProfileSchema.pre('save', function(next) {
  let completedFields = 0;
  const totalFields = 7;
  
  if (this.title) completedFields++;
  if (this.company) completedFields++;
  if (this.bio) completedFields++;
  if (this.experience) completedFields++;
  if (this.expertise && this.expertise.length > 0) completedFields++;
  if (this.yearsOfExperience >= 0) completedFields++;
  if (this.hourlyRate >= 0) completedFields++;
  
  this.isProfileComplete = completedFields >= 6; // At least 6 out of 7 fields
  
  next();
});

// Index for better query performance
mentorProfileSchema.index({ userId: 1 });
mentorProfileSchema.index({ isActive: 1, isProfileComplete: 1 });
mentorProfileSchema.index({ expertise: 1 });
mentorProfileSchema.index({ rating: -1 });
mentorProfileSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MentorProfile', mentorProfileSchema);