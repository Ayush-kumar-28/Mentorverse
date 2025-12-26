const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { connectMentorDB } = require('./config/mentorDatabase');
const { connectMenteeDB } = require('./config/menteeDatabase');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize server
const initializeServer = async () => {
  try {
    // Connect to MongoDB (main database)
    connectDB();

    // Connect to Mentor Database (separate database) and wait for it
    await connectMentorDB();
    console.log('Mentor database connected successfully');

    // Connect to Mentee Database (separate database) and wait for it
    await connectMenteeDB();
    console.log('Mentee database connected successfully');

    // Middleware
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Main application routes (mentee-focused)
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/mentors', require('./routes/mentors'));
    app.use('/api/mentees', require('./routes/mentees'));
    app.use('/api/sessions', require('./routes/sessions'));
    app.use('/api/doubts', require('./routes/doubts'));
    app.use('/api/chatbot', require('./routes/chatbot'));
    app.use('/api/matchmaking', require('./routes/matchmaking'));
    app.use('/api/profile', require('./routes/profile'));

    app.use('/api/dashboard', require('./routes/dashboard'));

    // Mentor-specific routes (separate database and full feature set)
    // Load these after mentor database is connected
    app.use('/api/mentor', require('./routes/mentor'));

    // Mentee-specific routes (separate database and full feature set)
    // Load these after mentee database is connected
    app.use('/api/mentee', require('./routes/mentee'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MentorVerse API is healthy',
    timestamp: new Date().toISOString(),
    databases: {
      main: 'Connected',
      mentor: 'Connected',
      mentee: 'Connected'
    }
  });
});

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'MentorVerse API Documentation',
    version: '2.0.0',
    databases: {
      main: 'Main application database (general data)',
      mentor: 'Separate mentor database (mentor-specific features)',
      mentee: 'Separate mentee database (mentee-specific features)'
    },
    endpoints: {
      main_api: {
        description: 'Original API endpoints for mentee application',
        base_url: '/api/',
        features: ['mentee auth', 'mentor browsing', 'session booking', 'chatbot']
      },
      mentor_api: {
        description: 'Comprehensive mentor-focused API with separate database',
        base_url: '/api/mentor/',
        features: ['mentor auth', 'profile management', 'dashboard', 'session management'],
        documentation: '/api/mentor/docs'
      },
      mentee_api: {
        description: 'Comprehensive mentee-focused API with separate database',
        base_url: '/api/mentee/',
        features: ['mentee auth', 'profile management', 'dashboard', 'session booking'],
        documentation: '/api/mentee/docs'
      }
    }
  });
});

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Initialize the server
initializeServer();