const mongoose = require('mongoose');

const menteeProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenteeUser',
    required: true,
    unique: true
  },
  // Personal Information
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  location: {
    country: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Professional Information
  currentRole: {
    type: String,
    trim: true,
    maxlength: [100, 'Current role cannot exceed 100 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  industry: {
    type: String,
    trim: true,
    maxlength: [50, 'Industry cannot exceed 50 characters']
  },
  experienceLevel: {
    type: String,
    enum: ['student', 'entry-level', 'mid-level', 'senior-level', 'executive'],
    default: 'student'
  },
  yearsOfExperience: {
    type: Number,
    min: [0, 'Years of experience cannot be negative'],
    max: [50, 'Years of experience cannot exceed 50'],
    default: 0
  },
  
  // Education
  education: [{
    degree: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    field: {
      type: String,
      trim: true
    },
    startYear: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 10
    },
    endYear: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 10
    },
    isCurrentlyEnrolled: {
      type: Boolean,
      default: false
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4.0
    }
  }],
  
  // Skills and Interests
  skills: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  
  interests: [{
    type: String,
    trim: true
  }],
  
  // Career Goals
  careerGoals: {
    shortTerm: [{
      goal: {
        type: String,
        required: true,
        trim: true
      },
      targetDate: {
        type: Date
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    longTerm: [{
      goal: {
        type: String,
        required: true,
        trim: true
      },
      targetDate: {
        type: Date
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }]
  },
  
  // Mentorship Preferences
  mentorshipPreferences: {
    preferredMentorGender: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any'
    },
    preferredMentorExperience: {
      type: String,
      enum: ['5-10 years', '10-15 years', '15+ years', 'any'],
      default: 'any'
    },
    preferredIndustries: [{
      type: String,
      trim: true
    }],
    preferredSessionTypes: [{
      type: String,
      enum: ['one-on-one', 'group', 'workshop', 'code-review', 'career-guidance'],
      default: 'one-on-one'
    }],
    availableTimeSlots: {
      monday: [{
        start: String,
        end: String
      }],
      tuesday: [{
        start: String,
        end: String
      }],
      wednesday: [{
        start: String,
        end: String
      }],
      thursday: [{
        start: String,
        end: String
      }],
      friday: [{
        start: String,
        end: String
      }],
      saturday: [{
        start: String,
        end: String
      }],
      sunday: [{
        start: String,
        end: String
      }]
    },
    budgetRange: {
      min: {
        type: Number,
        min: 0,
        default: 0
      },
      max: {
        type: Number,
        min: 0,
        default: 100
      },
      currency: {
        type: String,
        default: 'USD'
      }
    }
  },
  
  // Bio and Description
  bio: {
    type: String,
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  
  // Social Links
  socialLinks: {
    linkedin: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    },
    portfolio: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    }
  },
  
  // Profile Status
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Mentorship Statistics
  totalSessions: {
    type: Number,
    default: 0
  },
  completedSessions: {
    type: Number,
    default: 0
  },
  cancelledSessions: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  
  // Favorite Mentors
  favoriteMentors: [{
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Learning Path
  learningPath: {
    currentPath: {
      type: String,
      trim: true
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    milestones: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      targetDate: {
        type: Date
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date
      }
    }]
  },
  
  // Preferences
  preferences: {
    emailNotifications: {
      sessionReminders: {
        type: Boolean,
        default: true
      },
      mentorMessages: {
        type: Boolean,
        default: true
      },
      weeklyDigest: {
        type: Boolean,
        default: true
      },
      marketingEmails: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      showProfile: {
        type: Boolean,
        default: true
      },
      showProgress: {
        type: Boolean,
        default: true
      },
      allowMentorContact: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
menteeProfileSchema.index({ userId: 1 });
menteeProfileSchema.index({ isActive: 1 });
menteeProfileSchema.index({ experienceLevel: 1 });
menteeProfileSchema.index({ 'skills.name': 1 });
menteeProfileSchema.index({ interests: 1 });
menteeProfileSchema.index({ createdAt: -1 });

// Virtual for full name
menteeProfileSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || '';
});

// Virtual for age
menteeProfileSchema.virtual('age').get(function() {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  return null;
});

// Pre-save middleware to calculate completion percentage
menteeProfileSchema.pre('save', function(next) {
  let completedFields = 0;
  const totalFields = 15; // Adjust based on required fields
  
  // Check required fields
  if (this.firstName) completedFields++;
  if (this.lastName) completedFields++;
  if (this.currentRole) completedFields++;
  if (this.company) completedFields++;
  if (this.industry) completedFields++;
  if (this.bio) completedFields++;
  if (this.skills && this.skills.length > 0) completedFields++;
  if (this.interests && this.interests.length > 0) completedFields++;
  if (this.education && this.education.length > 0) completedFields++;
  if (this.careerGoals.shortTerm && this.careerGoals.shortTerm.length > 0) completedFields++;
  if (this.careerGoals.longTerm && this.careerGoals.longTerm.length > 0) completedFields++;
  if (this.mentorshipPreferences.preferredIndustries && this.mentorshipPreferences.preferredIndustries.length > 0) completedFields++;
  if (this.mentorshipPreferences.preferredSessionTypes && this.mentorshipPreferences.preferredSessionTypes.length > 0) completedFields++;
  if (this.location.country) completedFields++;
  if (this.phoneNumber) completedFields++;
  
  this.completionPercentage = Math.round((completedFields / totalFields) * 100);
  this.isProfileComplete = this.completionPercentage >= 80;
  
  next();
});

// Static method to find by user ID
menteeProfileSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

// Static method to find active profiles
menteeProfileSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Instance method to add favorite mentor
menteeProfileSchema.methods.addFavoriteMentor = function(mentorId) {
  const existingFavorite = this.favoriteMentors.find(
    fav => fav.mentorId.toString() === mentorId.toString()
  );
  
  if (!existingFavorite) {
    this.favoriteMentors.push({ mentorId });
  }
  
  return this.save();
};

// Instance method to remove favorite mentor
menteeProfileSchema.methods.removeFavoriteMentor = function(mentorId) {
  this.favoriteMentors = this.favoriteMentors.filter(
    fav => fav.mentorId.toString() !== mentorId.toString()
  );
  
  return this.save();
};

// Instance method to update session stats
menteeProfileSchema.methods.updateSessionStats = function(sessionData) {
  if (sessionData.status === 'completed') {
    this.completedSessions += 1;
    this.totalSpent += sessionData.amount || 0;
  } else if (sessionData.status === 'cancelled') {
    this.cancelledSessions += 1;
  }
  
  this.totalSessions += 1;
  
  return this.save();
};

// Create model factory function
const createModel = (connection) => {
  return connection.model('MenteeProfile', menteeProfileSchema);
};

module.exports = {
  createModel,
  schema: menteeProfileSchema
};