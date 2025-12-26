const mongoose = require('mongoose');
const { getMentorConnection } = require('../../config/mentorDatabase');

const mentorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorUser',
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Professional title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  bio: {
    type: String,
    required: [true, 'Bio is required'],
    trim: true,
    minlength: [50, 'Bio must be at least 50 characters'],
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  experience: {
    type: String,
    required: [true, 'Experience description is required'],
    trim: true,
    maxlength: [2000, 'Experience cannot exceed 2000 characters']
  },
  expertise: [{
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Each expertise area cannot exceed 50 characters']
  }],
  linkedin: {
    type: String,
    trim: true,
    match: [/^https?:\/\/(www\.)?linkedin\.com\/.*/, 'Please enter a valid LinkedIn URL']
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [0, 'Years of experience cannot be negative'],
    max: [50, 'Years of experience cannot exceed 50']
  },
  availability: {
    type: Map,
    of: [String],
    default: new Map()
  },
  hourlyRate: {
    type: Number,
    default: 0,
    min: [0, 'Hourly rate cannot be negative'],
    max: [10000, 'Hourly rate cannot exceed $10,000']
  },
  languages: [{
    type: String,
    default: ['English'],
    maxlength: [30, 'Language name cannot exceed 30 characters']
  }],
  timezone: {
    type: String,
    default: 'UTC',
    maxlength: [50, 'Timezone cannot exceed 50 characters']
  },
  specializations: [{
    type: String,
    trim: true,
    maxlength: [100, 'Specialization cannot exceed 100 characters']
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Certification name cannot exceed 100 characters']
    },
    issuer: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Issuer name cannot exceed 100 characters']
    },
    year: {
      type: Number,
      min: [1950, 'Year must be after 1950'],
      max: [new Date().getFullYear() + 5, 'Year cannot be more than 5 years in the future']
    },
    url: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.*/, 'Please enter a valid URL']
    }
  }],
  education: [{
    degree: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Degree cannot exceed 100 characters']
    },
    institution: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Institution name cannot exceed 100 characters']
    },
    year: {
      type: Number,
      min: [1950, 'Year must be after 1950'],
      max: [new Date().getFullYear() + 10, 'Year cannot be more than 10 years in the future']
    },
    field: {
      type: String,
      trim: true,
      maxlength: [100, 'Field of study cannot exceed 100 characters']
    }
  }],
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
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalSessions: {
    type: Number,
    default: 0,
    min: [0, 'Total sessions cannot be negative']
  },
  completedSessions: {
    type: Number,
    default: 0,
    min: [0, 'Completed sessions cannot be negative']
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: [0, 'Total reviews cannot be negative']
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: [0, 'Total earnings cannot be negative']
  },
  responseTime: {
    type: Number, // in minutes
    default: 60,
    min: [1, 'Response time must be at least 1 minute']
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    marketingEmails: {
      type: Boolean,
      default: true
    },
    sessionReminders: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
mentorProfileSchema.index({ userId: 1 });
mentorProfileSchema.index({ expertise: 1 });
mentorProfileSchema.index({ isActive: 1, isProfileComplete: 1 });
mentorProfileSchema.index({ rating: -1 });
mentorProfileSchema.index({ totalSessions: -1 });
mentorProfileSchema.index({ createdAt: -1 });
mentorProfileSchema.index({ 'specializations': 1 });

// Virtual for completion percentage
mentorProfileSchema.virtual('completionPercentage').get(function() {
  const requiredFields = ['title', 'company', 'bio', 'experience', 'expertise', 'yearsOfExperience'];
  const optionalFields = ['linkedin', 'certifications', 'education', 'specializations'];
  
  let completed = 0;
  let total = requiredFields.length + optionalFields.length;
  
  // Check required fields
  requiredFields.forEach(field => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
      completed++;
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : this[field].toString().trim())) {
      completed++;
    }
  });
  
  return Math.round((completed / total) * 100);
});

// Method to check if profile is complete
mentorProfileSchema.methods.checkCompleteness = function() {
  const required = ['title', 'company', 'bio', 'experience', 'expertise', 'yearsOfExperience'];
  const isComplete = required.every(field => {
    const value = this[field];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });
  
  if (this.isProfileComplete !== isComplete) {
    this.isProfileComplete = isComplete;
  }
  
  return isComplete;
};

// Pre-save middleware
mentorProfileSchema.pre('save', function(next) {
  this.checkCompleteness();
  next();
});

// Export schema and model creation function
module.exports = {
  schema: mentorProfileSchema,
  createModel: (connection) => connection.model('MentorProfile', mentorProfileSchema)
};