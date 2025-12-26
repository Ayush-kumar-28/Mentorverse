// Script to populate the database with demo mentor profiles
const mongoose = require('mongoose');
const demoMentors = require('../data/demoMentors');

// Import models
const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorverse', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to main database');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Function to create demo mentors
const createDemoMentors = async () => {
  try {
    console.log('🚀 Starting demo mentor creation...\n');

    for (const mentorData of demoMentors) {
      console.log(`📝 Creating mentor: ${mentorData.name}`);

      // Check if user already exists
      let user = await User.findOne({ email: mentorData.email });
      
      if (!user) {
        // Create user
        user = new User({
          name: mentorData.name,
          email: mentorData.email,
          password: 'demo123456', // Demo password
          role: 'mentor',
          avatar: mentorData.avatar,
          isActive: true,
          isEmailVerified: true
        });
        await user.save();
        console.log(`  ✅ User created: ${user.email}`);
      } else {
        console.log(`  ℹ️  User already exists: ${user.email}`);
      }

      // Check if mentor profile already exists
      let mentorProfile = await MentorProfile.findOne({ userId: user._id });
      
      if (!mentorProfile) {
        // Create mentor profile
        mentorProfile = new MentorProfile({
          userId: user._id,
          title: mentorData.title,
          company: mentorData.company,
          bio: mentorData.bio,
          experience: mentorData.experience,
          expertise: mentorData.expertise,
          linkedin: mentorData.linkedin,
          yearsOfExperience: mentorData.yearsOfExperience,
          availability: mentorData.availability,
          hourlyRate: Math.floor(Math.random() * 100) + 50, // Random rate between $50-150
          languages: ['English'],
          timezone: 'UTC',
          isActive: true,
          isProfileComplete: true,
          isVerified: true,
          rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0-5.0
          totalSessions: Math.floor(Math.random() * 50) + 10, // Random sessions 10-60
          completedSessions: Math.floor(Math.random() * 40) + 8, // Random completed sessions
          totalReviews: Math.floor(Math.random() * 30) + 5, // Random reviews 5-35
          responseTime: Math.floor(Math.random() * 120) + 30, // Random response time 30-150 minutes
          preferences: {
            emailNotifications: true,
            smsNotifications: false,
            marketingEmails: true,
            sessionReminders: true
          }
        });
        await mentorProfile.save();
        console.log(`  ✅ Mentor profile created for: ${mentorData.name}`);
      } else {
        console.log(`  ℹ️  Mentor profile already exists for: ${mentorData.name}`);
      }

      console.log(''); // Empty line for readability
    }

    console.log('🎉 Demo mentor creation completed!\n');

    // Display summary
    const totalUsers = await User.countDocuments({ role: 'mentor' });
    const totalMentorProfiles = await MentorProfile.countDocuments({ isActive: true });
    
    console.log('📊 Summary:');
    console.log(`  👥 Total mentor users: ${totalUsers}`);
    console.log(`  📋 Total active mentor profiles: ${totalMentorProfiles}`);
    console.log(`  🎯 Demo mentors added: ${demoMentors.length}`);

  } catch (error) {
    console.error('❌ Error creating demo mentors:', error);
  }
};

// Function to remove demo mentors (for cleanup)
const removeDemoMentors = async () => {
  try {
    console.log('🧹 Removing demo mentors...\n');

    const demoEmails = demoMentors.map(mentor => mentor.email);
    
    // Find demo users
    const demoUsers = await User.find({ email: { $in: demoEmails } });
    const demoUserIds = demoUsers.map(user => user._id);

    // Remove mentor profiles
    const deletedProfiles = await MentorProfile.deleteMany({ userId: { $in: demoUserIds } });
    console.log(`  ✅ Removed ${deletedProfiles.deletedCount} mentor profiles`);

    // Remove users
    const deletedUsers = await User.deleteMany({ email: { $in: demoEmails } });
    console.log(`  ✅ Removed ${deletedUsers.deletedCount} users`);

    console.log('🎉 Demo mentor cleanup completed!\n');

  } catch (error) {
    console.error('❌ Error removing demo mentors:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();

  const command = process.argv[2];

  switch (command) {
    case 'create':
      await createDemoMentors();
      break;
    case 'remove':
      await removeDemoMentors();
      break;
    case 'recreate':
      await removeDemoMentors();
      await createDemoMentors();
      break;
    default:
      console.log('📋 Usage:');
      console.log('  node populateDemoMentors.js create   - Create demo mentors');
      console.log('  node populateDemoMentors.js remove   - Remove demo mentors');
      console.log('  node populateDemoMentors.js recreate - Remove and recreate demo mentors');
      break;
  }

  mongoose.connection.close();
  console.log('👋 Database connection closed');
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the script
main();