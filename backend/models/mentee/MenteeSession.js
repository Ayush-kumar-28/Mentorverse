const mongoose = require('mongoose');

const menteeSessionSchema = new mongoose.Schema({
  // Session Participants
  menteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenteeProfile',
    required: true
  },
  mentorId: {
    type: String, // External mentor ID from main system or mentor database
    required: true
  },
  mentorName: {
    type: String,
    required: true,
    trim: true
  },
  mentorEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  mentorAvatar: {
    type: String,
    default: ''
  },
  
  // Session Details
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    minlength: [5, 'Session title must be at least 5 characters'],
    maxlength: [200, 'Session title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Session description is required'],
    trim: true,
    minlength: [10, 'Session description must be at least 10 characters'],
    maxlength: [1000, 'Session description cannot exceed 1000 characters']
  },
  
  // Scheduling
  scheduledStart: {
    type: Date,
    required: true
  },
  scheduledEnd: {
    type: Date,
    required: true
  },
  actualStart: {
    type: Date
  },
  actualEnd: {
    type: Date
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: [15, 'Session duration must be at least 15 minutes'],
    max: [480, 'Session duration cannot exceed 480 minutes (8 hours)']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Session Status
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled'
  },
  
  // Session Type and Category
  sessionType: {
    type: String,
    enum: ['one-on-one', 'group', 'workshop', 'code-review', 'career-guidance', 'mock-interview'],
    default: 'one-on-one'
  },
  category: {
    type: String,
    enum: ['technical', 'career', 'personal-development', 'interview-prep', 'project-review', 'general'],
    default: 'general'
  },
  
  // Session Content
  topics: [{
    type: String,
    trim: true
  }],
  goals: [{
    type: String,
    trim: true
  }],
  agenda: [{
    item: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: Number, // in minutes
      min: 1
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Meeting Information
  meetingLink: {
    type: String,
    trim: true
  },
  meetingId: {
    type: String,
    trim: true
  },
  meetingPassword: {
    type: String,
    trim: true
  },
  meetingPlatform: {
    type: String,
    enum: ['zoom', 'google-meet', 'teams', 'skype', 'other'],
    default: 'zoom'
  },
  
  // Session Materials
  materials: {
    prework: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      url: {
        type: String,
        trim: true
      },
      type: {
        type: String,
        enum: ['reading', 'video', 'exercise', 'project', 'other'],
        default: 'reading'
      },
      isCompleted: {
        type: Boolean,
        default: false
      }
    }],
    resources: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      url: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        enum: ['document', 'video', 'article', 'tool', 'book', 'course', 'other'],
        default: 'document'
      },
      description: {
        type: String,
        trim: true
      }
    }],
    homework: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        required: true,
        trim: true
      },
      dueDate: {
        type: Date
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date
      },
      feedback: {
        type: String,
        trim: true
      }
    }]
  },
  
  // Notes and Feedback
  notes: {
    mentee: {
      type: String,
      trim: true,
      maxlength: [2000, 'Mentee notes cannot exceed 2000 characters']
    },
    mentor: {
      type: String,
      trim: true,
      maxlength: [2000, 'Mentor notes cannot exceed 2000 characters']
    },
    admin: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    }
  },
  
  // Feedback and Ratings
  feedback: {
    menteeRating: {
      type: Number,
      min: 1,
      max: 5
    },
    mentorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    menteeReview: {
      type: String,
      trim: true,
      maxlength: [1000, 'Mentee review cannot exceed 1000 characters']
    },
    mentorReview: {
      type: String,
      trim: true,
      maxlength: [1000, 'Mentor review cannot exceed 1000 characters']
    },
    menteeSkillsImproved: [{
      type: String,
      trim: true
    }],
    menteeGoalsAchieved: [{
      type: String,
      trim: true
    }],
    wouldRecommend: {
      type: Boolean
    },
    feedbackSubmittedAt: {
      type: Date
    }
  },
  
  // Payment Information
  payment: {
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['credit-card', 'debit-card', 'paypal', 'stripe', 'bank-transfer', 'wallet'],
      default: 'credit-card'
    },
    transactionId: {
      type: String,
      trim: true
    },
    paymentIntentId: {
      type: String,
      trim: true
    },
    paidAt: {
      type: Date
    },
    refundedAt: {
      type: Date
    },
    refundAmount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  // Cancellation Information
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['mentee', 'mentor', 'admin', 'system']
    },
    cancelledAt: {
      type: Date
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    },
    refundAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    refundProcessed: {
      type: Boolean,
      default: false
    }
  },
  
  // Rescheduling Information
  rescheduling: {
    rescheduledBy: {
      type: String,
      enum: ['mentee', 'mentor', 'admin']
    },
    rescheduledAt: {
      type: Date
    },
    previousScheduledStart: {
      type: Date
    },
    previousScheduledEnd: {
      type: Date
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rescheduling reason cannot exceed 500 characters']
    },
    rescheduleCount: {
      type: Number,
      default: 0
    }
  },
  
  // Follow-up Information
  followUp: {
    nextSessionScheduled: {
      type: Boolean,
      default: false
    },
    nextSessionDate: {
      type: Date
    },
    actionItems: [{
      item: {
        type: String,
        required: true,
        trim: true
      },
      dueDate: {
        type: Date
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date
      }
    }],
    mentorRecommendations: [{
      type: String,
      trim: true
    }]
  },
  
  // Session Recording (if applicable)
  recording: {
    isRecorded: {
      type: Boolean,
      default: false
    },
    recordingUrl: {
      type: String,
      trim: true
    },
    recordingPassword: {
      type: String,
      trim: true
    },
    recordingDuration: {
      type: Number // in minutes
    },
    recordingSize: {
      type: Number // in MB
    },
    recordingExpiry: {
      type: Date
    }
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'api', 'admin'],
    default: 'web'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPrivate: {
    type: Boolean,
    default: false
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
menteeSessionSchema.index({ menteeId: 1 });
menteeSessionSchema.index({ mentorId: 1 });
menteeSessionSchema.index({ status: 1 });
menteeSessionSchema.index({ scheduledStart: 1 });
menteeSessionSchema.index({ scheduledEnd: 1 });
menteeSessionSchema.index({ createdAt: -1 });
menteeSessionSchema.index({ 'payment.status': 1 });
menteeSessionSchema.index({ sessionType: 1 });
menteeSessionSchema.index({ category: 1 });

// Compound indexes
menteeSessionSchema.index({ menteeId: 1, status: 1 });
menteeSessionSchema.index({ menteeId: 1, scheduledStart: 1 });
menteeSessionSchema.index({ mentorId: 1, scheduledStart: 1 });

// Virtual for actual duration
menteeSessionSchema.virtual('actualDurationMinutes').get(function() {
  if (this.actualStart && this.actualEnd) {
    return Math.round((this.actualEnd - this.actualStart) / (1000 * 60));
  }
  return null;
});

// Virtual for session cost per minute
menteeSessionSchema.virtual('costPerMinute').get(function() {
  if (this.payment.amount && this.durationMinutes) {
    return this.payment.amount / this.durationMinutes;
  }
  return 0;
});

// Virtual for time until session
menteeSessionSchema.virtual('timeUntilSession').get(function() {
  if (this.scheduledStart) {
    return this.scheduledStart - new Date();
  }
  return null;
});

// Pre-save middleware to calculate scheduled end time
menteeSessionSchema.pre('save', function(next) {
  if (this.scheduledStart && this.durationMinutes && !this.scheduledEnd) {
    this.scheduledEnd = new Date(this.scheduledStart.getTime() + (this.durationMinutes * 60 * 1000));
  }
  next();
});

// Instance method to check if session can be cancelled
menteeSessionSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const sessionStart = new Date(this.scheduledStart);
  const hoursUntilSession = (sessionStart - now) / (1000 * 60 * 60);
  
  // Can cancel if more than 24 hours before session
  return hoursUntilSession > 24 && ['scheduled', 'confirmed'].includes(this.status);
};

// Instance method to check if session can be rescheduled
menteeSessionSchema.methods.canBeRescheduled = function() {
  const now = new Date();
  const sessionStart = new Date(this.scheduledStart);
  const hoursUntilSession = (sessionStart - now) / (1000 * 60 * 60);
  
  // Can reschedule if more than 48 hours before session and less than 3 reschedules
  return hoursUntilSession > 48 && 
         ['scheduled', 'confirmed'].includes(this.status) && 
         (this.rescheduling.rescheduleCount || 0) < 3;
};

// Instance method to calculate refund amount
menteeSessionSchema.methods.calculateRefund = function() {
  if (!this.canBeCancelled()) {
    return 0;
  }
  
  const now = new Date();
  const sessionStart = new Date(this.scheduledStart);
  const hoursUntilSession = (sessionStart - now) / (1000 * 60 * 60);
  
  // Full refund if more than 48 hours
  if (hoursUntilSession > 48) {
    return this.payment.amount;
  }
  
  // 50% refund if 24-48 hours
  if (hoursUntilSession > 24) {
    return this.payment.amount * 0.5;
  }
  
  // No refund if less than 24 hours
  return 0;
};

// Instance method to mark session as completed
menteeSessionSchema.methods.markCompleted = function() {
  this.status = 'completed';
  if (!this.actualEnd) {
    this.actualEnd = new Date();
  }
  return this.save();
};

// Instance method to add action item
menteeSessionSchema.methods.addActionItem = function(item, dueDate) {
  this.followUp.actionItems.push({
    item,
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
  });
  return this.save();
};

// Static method to find upcoming sessions
menteeSessionSchema.statics.findUpcoming = function(menteeId, limit = 10) {
  return this.find({
    menteeId,
    scheduledStart: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] }
  })
  .sort({ scheduledStart: 1 })
  .limit(limit);
};

// Static method to find past sessions
menteeSessionSchema.statics.findPast = function(menteeId, limit = 10) {
  return this.find({
    menteeId,
    status: { $in: ['completed', 'cancelled', 'no-show'] }
  })
  .sort({ scheduledStart: -1 })
  .limit(limit);
};

// Static method to find sessions by date range
menteeSessionSchema.statics.findByDateRange = function(menteeId, startDate, endDate) {
  return this.find({
    menteeId,
    scheduledStart: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ scheduledStart: 1 });
};

// Create model factory function
const createModel = (connection) => {
  return connection.model('MenteeSession', menteeSessionSchema);
};

module.exports = {
  createModel,
  schema: menteeSessionSchema
};