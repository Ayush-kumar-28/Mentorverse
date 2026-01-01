const validateEnvironment = () => {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const optionalEnvVars = [
    'MENTOR_MONGODB_URI',
    'MENTEE_MONGODB_URI',
    'PORT',
    'NODE_ENV',
    'JWT_EXPIRE'
  ];

  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check optional variables and provide defaults
  if (!process.env.MENTOR_MONGODB_URI) {
    process.env.MENTOR_MONGODB_URI = 'mongodb://localhost:27017/mentorverse_mentors';
    warnings.push('MENTOR_MONGODB_URI not set, using default: mongodb://localhost:27017/mentorverse_mentors');
  }

  if (!process.env.MENTEE_MONGODB_URI) {
    process.env.MENTEE_MONGODB_URI = 'mongodb://localhost:27017/mentorverse_mentees';
    warnings.push('MENTEE_MONGODB_URI not set, using default: mongodb://localhost:27017/mentorverse_mentees');
  }

  if (!process.env.PORT) {
    process.env.PORT = '5000';
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  if (!process.env.JWT_EXPIRE) {
    process.env.JWT_EXPIRE = '7d';
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('Environment variable warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Throw error if required variables are missing
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters long for security');
  }

  console.log('Environment validation passed');
};

module.exports = validateEnvironment;