const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const menteeUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'mentee',
    enum: ['mentee']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
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
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  socialProfiles: {
    linkedin: {
      type: String,
      default: ''
    },
    github: {
      type: String,
      default: ''
    },
    twitter: {
      type: String,
      default: ''
    },
    portfolio: {
      type: String,
      default: ''
    }
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingStep: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  }
});

// Indexes
menteeUserSchema.index({ email: 1 });
menteeUserSchema.index({ isActive: 1 });
menteeUserSchema.index({ createdAt: -1 });

// Virtual for account lock status
menteeUserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
menteeUserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
menteeUserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to increment login attempts
menteeUserSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
menteeUserSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find by email
menteeUserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
menteeUserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Instance method to generate email verification token
menteeUserSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Instance method to generate password reset token
menteeUserSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  return token;
};

// Create model factory function
const createModel = (connection) => {
  return connection.model('MenteeUser', menteeUserSchema);
};

module.exports = {
  createModel,
  schema: menteeUserSchema
};