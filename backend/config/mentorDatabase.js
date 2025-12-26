const mongoose = require('mongoose');

// Separate connection for mentor database
let mentorConnection = null;

const connectMentorDB = async () => {
  try {
    if (mentorConnection) {
      return mentorConnection;
    }

    const mentorDbUri = process.env.MENTOR_MONGODB_URI || 'mongodb://localhost:27017/mentorverse_mentors';
    
    mentorConnection = await mongoose.createConnection(mentorDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('Mentor Database connected successfully');

    mentorConnection.on('error', (error) => {
      console.error('Mentor Database connection error:', error);
    });

    mentorConnection.on('disconnected', () => {
      console.log('Mentor Database disconnected');
    });

    return mentorConnection;
  } catch (error) {
    console.error('Failed to connect to Mentor Database:', error);
    throw error;
  }
};

const getMentorConnection = () => {
  if (!mentorConnection) {
    throw new Error('Mentor database not connected. Call connectMentorDB() first.');
  }
  return mentorConnection;
};

module.exports = {
  connectMentorDB,
  getMentorConnection
};