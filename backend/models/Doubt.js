const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'model', 'other'], default: 'user' },
  text: { type: String, required: true, trim: true }
}, { timestamps: true });

const doubtSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true, trim: true },
  participants: { type: Number, default: 1, min: 1 },
  imageUrl: { type: String },
  messages: { type: [messageSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Doubt', doubtSchema);
