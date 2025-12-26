const mongoose = require('mongoose');

let menteeConnection = null;

/**
 * Connect to the separate Mentee Database
 * This database is dedicated to mentee-specific features and data
 */
const connectMenteeDB = async () => {
  try {
    if (menteeConnection && menteeConnection.readyState === 1) {
      console.log('Mentee database already connected');
      return menteeConnection;
    }

    const MENTEE_MONGODB_URI = process.env.MENTEE_MONGODB_URI || 'mongodb://localhost:27017/mentorverse_mentees';
    
    menteeConnection = mongoose.createConnection(MENTEE_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    // Wait for connection to be established
    await new Promise((resolve, reject) => {
      menteeConnection.on('connected', () => {
        console.log('Mentee Database connected successfully');
        resolve();
      });

      menteeConnection.on('error', (err) => {
        console.error('Mentee Database connection error:', err);
        reject(err);
      });
    });

    menteeConnection.on('disconnected', () => {
      console.log('Mentee Database disconnected');
    });

    return menteeConnection;

  } catch (error) {
    console.error('Failed to connect to Mentee Database:', error);
    throw error;
  }
};

/**
 * Get the mentee database connection
 * Throws error if not connected
 */
const getMenteeConnection = () => {
  if (!menteeConnection || menteeConnection.readyState !== 1) {
    throw new Error('Mentee database not connected. Call connectMenteeDB() first.');
  }
  return menteeConnection;
};

/**
 * Close the mentee database connection
 */
const closeMenteeDB = async () => {
  try {
    if (menteeConnection) {
      await menteeConnection.close();
      menteeConnection = null;
      console.log('Mentee Database connection closed');
    }
  } catch (error) {
    console.error('Error closing Mentee Database connection:', error);
    throw error;
  }
};

/**
 * Check if mentee database is connected
 */
const isMenteeDBConnected = () => {
  return menteeConnection && menteeConnection.readyState === 1;
};

module.exports = {
  connectMenteeDB,
  getMenteeConnection,
  closeMenteeDB,
  isMenteeDBConnected
};