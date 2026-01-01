const mongoose = require('mongoose');

const workExperienceSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  company: { type: String, trim: true },
  duration: { type: String, trim: true }
}, { _id: false });

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  title: { type: String, trim: true },
  company: { type: String, trim: true },
  expertise: [{ type: String, trim: true }],
  matchReasoning: { type: String, trim: true },
  availability: { type: Map, of: [String], default: undefined },
  bio: { type: String, trim: true },
  experience: [workExperienceSchema],
  email: { type: String, trim: true }
}, { _id: false });

const chatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model', 'other'], default: 'other' },
  text: { type: String, required: true, trim: true },
  author: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  mentor: { type: participantSchema, required: true },
  mentee: { type: participantSchema, required: true },
  reason: { type: String, trim: true },
  scheduledStart: { type: Date, required: true },
  durationMinutes: { type: Number, default: 30 },
  status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  meetingLink: { type: String, trim: true },
  chatHistory: [chatMessageSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

sessionSchema.index({ createdBy: 1, scheduledStart: -1 });

module.exports = mongoose.model('Session', sessionSchema);
