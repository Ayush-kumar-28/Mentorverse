/**
 * Cleanup Sessions Script
 * 
 * This script helps you clean up sessions from the database.
 * 
 * Usage:
 * node scripts/cleanupSessions.js [option]
 * 
 * Options:
 * - all: Delete all sessions
 * - old: Delete sessions older than 30 days
 * - cancelled: Delete cancelled sessions
 * - past: Delete completed/cancelled sessions
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Session = mongoose.model('Session', new mongoose.Schema({
  mentor: Object,
  mentee: Object,
  reason: String,
  scheduledStart: Date,
  durationMinutes: Number,
  status: String,
  meetingLink: String,
  chatHistory: Array,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
}, { strict: false }));

async function cleanupSessions(option = 'all') {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorverse');
    console.log('Connected to MongoDB');

    let filter = {};
    let description = '';

    switch (option) {
      case 'all':
        filter = {};
        description = 'all sessions';
        break;

      case 'old':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filter = { scheduledStart: { $lt: thirtyDaysAgo } };
        description = 'sessions older than 30 days';
        break;

      case 'cancelled':
        filter = { status: 'cancelled' };
        description = 'cancelled sessions';
        break;

      case 'past':
        const now = new Date();
        filter = {
          $or: [
            { status: 'completed' },
            { status: 'cancelled' },
            { scheduledStart: { $lt: now }, status: 'upcoming' }
          ]
        };
        description = 'past/completed sessions';
        break;

      default:
        console.log('Invalid option. Use: all, old, cancelled, or past');
        process.exit(1);
    }

    // Count sessions to be deleted
    const count = await Session.countDocuments(filter);
    console.log(`Found ${count} ${description}`);

    if (count === 0) {
      console.log('No sessions to delete.');
      process.exit(0);
    }

    // Delete sessions
    const result = await Session.deleteMany(filter);
    console.log(`✅ Successfully deleted ${result.deletedCount} ${description}`);

    // Show remaining sessions
    const remaining = await Session.countDocuments({});
    console.log(`Remaining sessions in database: ${remaining}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get option from command line arguments
const option = process.argv[2] || 'all';
cleanupSessions(option);
