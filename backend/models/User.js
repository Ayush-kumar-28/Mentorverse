const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['mentor', 'mentee'], required: true },
  college: { type: String, trim: true },
  course: { type: String, trim: true },
  profile: {
    title: String,
    bio: String,
    skills: [String],
    experience: String,
    interests: [String],
    avatar: String
  },
  // Mentor specific fields
  expertise: [String],
  availability: [{
    day: String,
    timeSlots: [String]
  }],
  rating: { type: Number, default: 0 },
  // Mentee specific fields
  goals: [String],
  currentLevel: String
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password.trim(), 12);
  next();
});

module.exports = mongoose.model('User', userSchema);