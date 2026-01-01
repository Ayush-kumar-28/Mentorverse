const mongoose = require('mongoose');
const { getMentorConnection } = require('../../config/mentorDatabase');

const mentorSessionSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorProfile',
    required: [true, 'Mentor ID is required']
  },
  menteeId: {
    type: String, // External mentee ID from main database
    required: [true, 'Mentee ID is required']
  },
  menteeName: {
    type: String,
    required: [true, 'Mentee name is required'],
    trim: true
  },
  menteeEmail: {
    type: String,
    required: [true, 'Mentee email is required'],
    lowercase: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Session description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  scheduledStart: {
    type: Date,
    required: [true, 'Scheduled start time is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Scheduled start time must be in the future'
    }
  },
  scheduledEnd: {
    type: Date,
    required: [true, 'Scheduled end time is required'],
    validate: {
      validator: function(value) {
        return value > this.scheduledStart;
      },
      message: 'Scheduled end time must be after start time'
    }
  },
  actualStart: {
    type: Date,
    default: null
  },
  actualEnd: {
    type: Date,
    default: null
  },
  durationMinutes: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Session must be at least 15 minutes'],
    max: [480, 'Session cannot exceed 8 hours']
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      message: 'Invalid session status'
    },
    default: 'scheduled'
  },
  meetingLink: {
    type: String,
    trim: true
  },
  meetingId: {
    type: String,
    trim: true
  },
  sessionType: {
    type: String,
    enum: ['one-on-one', 'group', 'workshop'],
    default: 'one-on-one'
  },
  topics: [{
    type: String,
    trim: true,
    maxlength: [100, 'Topic cannot exceed 100 characters']
  }],
  goals: [{
    type: String,
    trim: true,
    maxlength: [200, 'Goal cannot exceed 200 characters']
  }],
  notes: {
    mentor: {
      type: String,
      trim: true,
      maxlength: [2000, 'Mentor notes cannot exceed 2000 characters']
    },
    mentee: {
      type: String,
      trim: true,
      maxlength: [2000, 'Mentee notes cannot exceed 2000 characters']
    },
    admin: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    }
  },
  feedback: {
    mentorRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    menteeRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    mentorReview: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    menteeReview: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    }
  },
  payment: {
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      trim: true
    },
    paidAt: {
      type: Date
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    sentAt: {
      type: Date,
      required: true
    },
    recipient: {
      type: String,
      enum: ['mentor', 'mentee', 'both'],
      required: true
    }
  }],
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['mentor', 'mentee', 'admin']
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
      min: [0, 'Refund amount cannot be negative']
    }
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly']
    },
    endDate: {
      type: Date
    },
    maxSessions: {
      type: Number,
      min: [1, 'Max sessions must be at least 1']
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
mentorSessionSchema.index({ mentorId: 1, scheduledStart: -1 });
mentorSessionSchema.index({ menteeId: 1, scheduledStart: -1 });
mentorSessionSchema.index({ status: 1 });
mentorSessionSchema.index({ scheduledStart: 1 });
mentorSessionSchema.index({ createdAt: -1 });
mentorSessionSchema.index({ 'payment.status': 1 });

// Virtual for session duration in hours
mentorSessionSchema.virtual('durationHours').get(function() {
  return this.durationMinutes / 60;
});

// Virtual for actual duration
mentorSessionSchema.virtual('actualDurationMinutes').get(function() {
  if (this.actualStart && this.actualEnd) {
    return Math.round((this.actualEnd - this.actualStart) / (1000 * 60));
  }
  return null;
});

// Method to check if session can be cancelled
mentorSessionSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const sessionStart = new Date(this.scheduledStart);
  const hoursUntilSession = (sessionStart - now) / (1000 * 60 * 60);
  
  return this.status === 'scheduled' && hoursUntilSession >= 24; // 24 hours notice
};

// Method to calculate refund amount
mentorSessionSchema.methods.calculateRefund = function() {
  if (!this.canBeCancelled()) {
    return 0;
  }
  
  const now = new Date();
  const sessionStart = new Date(this.scheduledStart);
  const hoursUntilSession = (sessionStart - now) / (1000 * 60 * 60);
  
  if (hoursUntilSession >= 48) {
    return this.payment.amount; // Full refund
  } else if (hoursUntilSession >= 24) {
    return this.payment.amount * 0.5; // 50% refund
  }
  
  return 0;
};

// Pre-save middleware
mentorSessionSchema.pre('save', function(next) {
  // Auto-calculate scheduled end time if not provided
  if (!this.scheduledEnd && this.scheduledStart && this.durationMinutes) {
    this.scheduledEnd = new Date(this.scheduledStart.getTime() + (this.durationMinutes * 60 * 1000));
  }
  
  // Generate meeting link if not provided
  if (!this.meetingLink && this.status === 'confirmed') {
    this.meetingLink = `https://meet.jit.si/MentorVerse-${this._id}`;
  }
  
  next();
});

// Export schema and model creation function
module.exports = {
  schema: mentorSessionSchema,
  createModel: (connection) => connection.model('MentorSession', mentorSessionSchema)
};