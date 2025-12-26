# MentorVerse 🌟

**A comprehensive mentorship platform connecting aspiring professionals with industry experts**

MentorVerse is a modern, full-stack web application that facilitates meaningful mentorship connections between experienced professionals (mentors) and aspiring individuals (mentees). The platform provides a seamless experience for scheduling sessions, conducting video calls, and managing mentorship relationships.

## 🚀 Live Demo

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000

## 📋 Table of Contents

- [Features Overview](#features-overview)
- [Mentee Features](#mentee-features)
- [Mentor Features](#mentor-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Features Overview

### Core Functionality
- **Dual User System**: Separate experiences for mentors and mentees
- **Smart Matching**: AI-powered mentor recommendations
- **Video Calling**: Integrated Jitsi video conferencing
- **Session Management**: Complete booking and scheduling system
- **Profile Management**: Comprehensive user profiles
- **Responsive Design**: Mobile-first, works on all devices
- **Real-time Notifications**: Stay updated on sessions and activities

### Security & Performance
- **JWT Authentication**: Secure token-based authentication
- **Multi-Database Architecture**: Separate databases for scalability
- **Rate Limiting**: API protection against abuse
- **Data Validation**: Comprehensive input validation
- **Error Handling**: Robust error management

## 👨‍🎓 Mentee Features

### 🏠 Dashboard
- **Personalized Welcome**: Dynamic greeting with user's name
- **Session Statistics**: Track completed, upcoming, and total sessions
- **Favorite Mentors**: Quick access to frequently booked mentors
- **Monthly Progress**: Visual chart showing session activity
- **Quick Actions**: Easy navigation to key features

### 🤖 Smart Match
- **AI-Powered Recommendations**: Intelligent mentor matching based on:
  - Current skills and desired skills
  - Career goals and aspirations
  - Industry interests
  - Learning preferences
- **Detailed Matching Reasons**: Understand why mentors are recommended
- **Filtering Options**: Refine matches by expertise, experience, company

### 🔍 Browse Mentors
- **Comprehensive Mentor Directory**: Browse all available mentors
- **Advanced Filtering**: Filter by:
  - Expertise areas
  - Years of experience
  - Company
  - Availability
- **Detailed Profiles**: View mentor backgrounds, experience, and reviews
- **Real-time Availability**: See current availability and book instantly

### 📅 Session Booking
- **Interactive Calendar**: Visual date selection
- **Time Slot Selection**: Choose from available time slots
- **Session Customization**: 
  - Select session duration (30, 60, 90 minutes)
  - Add session goals and topics
  - Include specific questions or areas of focus
- **Instant Confirmation**: Immediate booking confirmation with meeting details

### 🎥 My Sessions
- **Upcoming Sessions**: View and manage scheduled sessions
- **Session History**: Review past sessions with details
- **Video Call Integration**: One-click join for video sessions
- **Meeting Links**: Easy access to video call links
- **Session Notes**: Add and view session notes and outcomes

### ❓ Doubt Room
- **Quick Questions**: Ask mentors quick questions
- **Community Support**: Get help from the mentor community
- **Topic Categories**: Organize questions by subject area
- **Response Tracking**: Track responses and follow-ups

### 🎓 Workshops
- **Skill-Building Workshops**: Access to group learning sessions
- **Expert-Led Sessions**: Learn from industry professionals
- **Interactive Learning**: Participate in hands-on workshops
- **Certificates**: Earn completion certificates

### 👤 Profile Management
- **Personal Information**: Manage basic profile details
- **Academic Background**: Add college, course, and academic achievements
- **Skills & Interests**: Track current skills and learning interests
- **Career Goals**: Define and update career aspirations
- **Profile Picture**: Upload and manage profile photos
- **Learning Path**: Track progress and set learning milestones

## 👨‍💼 Mentor Features

### 🏠 Dashboard
- **Mentor Analytics**: Comprehensive statistics including:
  - Total mentees helped
  - Sessions conducted
  - Average session rating
  - Monthly session trends
- **Upcoming Sessions**: Quick view of scheduled sessions
- **Recent Activity**: Latest bookings and interactions
- **Performance Metrics**: Track mentoring impact and effectiveness

### 📅 Session Management
- **Session Overview**: View all upcoming and past sessions
- **Session Details**: Access mentee information and session goals
- **Meeting Management**: 
  - Generate and share meeting links
  - Start video calls
  - Copy meeting links for sharing
- **Session History**: Review past sessions with outcomes
- **Availability Management**: Set and update available time slots

### 👤 Profile Management
- **Professional Profile**: Comprehensive mentor profile including:
  - Professional title and company
  - Years of experience
  - Areas of expertise
  - Professional bio
  - LinkedIn profile
  - Profile picture
- **Expertise Tags**: Add and manage skill areas
- **Availability Calendar**: Set weekly availability patterns
- **Mentoring Preferences**: Define mentoring style and approach

### 📊 Analytics & Insights
- **Mentoring Impact**: Track the success of mentoring relationships
- **Session Analytics**: Detailed session statistics and trends
- **Mentee Progress**: Monitor mentee development over time
- **Feedback Management**: Collect and review session feedback

### 🎥 Video Calling
- **Integrated Video Calls**: Seamless Jitsi integration
- **Meeting Room Management**: Create and manage meeting rooms
- **Screen Sharing**: Share screen during sessions
- **Recording Options**: Record sessions for later review (with consent)

## 🛠 Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe JavaScript for better development experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React Router**: Client-side routing for single-page application
- **Axios**: HTTP client for API communication

### Backend
- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Web application framework
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing and security
- **CORS**: Cross-Origin Resource Sharing middleware
- **Express Rate Limit**: API rate limiting for security
- **Multer**: File upload handling

### Database
- **MySQL**: Relational database management system
- **mysql2**: MySQL client for Node.js
- **Multi-Database Architecture**:
  - Main Database: Core system and mentee data
  - Mentor Database: Dedicated mentor profiles and sessions
  - Mentee Database: Dedicated mentee profiles and learning data

### Video Conferencing
- **Jitsi Meet**: Open-source video conferencing solution
- **WebRTC**: Real-time communication for video/audio
- **Meeting Room Management**: Dynamic room creation and management

### Development Tools
- **ESLint**: Code linting and quality assurance
- **Prettier**: Code formatting
- **Git**: Version control
- **npm**: Package management

### Deployment & DevOps
- **Environment Variables**: Secure configuration management
- **HTTPS**: Secure communication
- **Error Logging**: Comprehensive error tracking
- **Health Checks**: System monitoring and status checks

## 🏗 Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Databases     │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   (MySQL)       │
│   Port: 3001    │    │   Port: 5000    │    │   Multi-DB      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  Jitsi Meet     │              │
                        │  (Video Calls)  │              │
                        └─────────────────┘              │
                                                         │
                        ┌─────────────────┐              │
                        │  File Storage   │◄─────────────┘
                        │  (Avatars)      │
                        └─────────────────┘
```

### Database Architecture
```
Main Database (mentorverse)
├── users (mentee accounts)
├── sessions (session bookings)
├── mentors (mentor visibility)
└── system_data

Mentor Database (mentorverse_mentors)
├── mentor_users (mentor accounts)
├── mentor_profiles (detailed profiles)
├── mentor_sessions (mentor session data)
└── mentor_analytics

Mentee Database (mentorverse_mentees)
├── mentee_users (mentee accounts)
├── mentee_profiles (detailed profiles)
├── mentee_sessions (mentee session data)
└── learning_paths
```

### Component Architecture
```
App.tsx
├── NavigationBar.tsx
├── Dashboard.tsx (Mentee)
│   ├── MentorRecommendations.tsx
│   ├── BookingModal.tsx
│   ├── BookedSessionsView.tsx
│   └── MenteeProfileView.tsx
├── MentorDashboardNew.tsx (Mentor)
│   ├── MentorProfileView.tsx
│   ├── MentorProfileEdit.tsx
│   └── BookedSessionsView.tsx
└── VideoCallPage.tsx
```

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mentorverse.git
   cd mentorverse
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=mentorverse
   
   # Mentor Database
   MENTOR_DB_HOST=localhost
   MENTOR_DB_USER=your_mysql_user
   MENTOR_DB_PASSWORD=your_mysql_password
   MENTOR_DB_NAME=mentorverse_mentors
   
   # Mentee Database
   MENTEE_DB_HOST=localhost
   MENTEE_DB_USER=your_mysql_user
   MENTEE_DB_PASSWORD=your_mysql_password
   MENTEE_DB_NAME=mentorverse_mentees
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up databases**
   ```bash
   # Create databases in MySQL
   mysql -u root -p
   CREATE DATABASE mentorverse;
   CREATE DATABASE mentorverse_mentors;
   CREATE DATABASE mentorverse_mentees;
   ```

5. **Populate demo data**
   ```bash
   node scripts/populateDemoMentors.js
   ```

6. **Start the backend server**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_JITSI_DOMAIN=meet.jit.si
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:5000

## 🎮 Usage

### For Mentees

1. **Sign Up**: Create a mentee account with your details
2. **Complete Profile**: Add your academic background, skills, and goals
3. **Discover Mentors**: Use Smart Match or Browse to find mentors
4. **Book Sessions**: Schedule sessions with your chosen mentors
5. **Join Video Calls**: Attend sessions via integrated video calling
6. **Track Progress**: Monitor your learning journey and session history

### For Mentors

1. **Sign Up**: Create a mentor account with professional details
2. **Build Profile**: Add expertise, experience, and availability
3. **Manage Sessions**: View and manage mentee bookings
4. **Conduct Sessions**: Host video calls and provide guidance
5. **Track Impact**: Monitor your mentoring effectiveness and reach

### Demo Accounts

The system includes 10 professional demo mentor profiles for testing:
- Sarah Chen (Google - Software Engineer)
- Marcus Johnson (Microsoft - Product Manager)
- Dr. Priya Patel (Netflix - Data Science Manager)
- Alex Rodriguez (Airbnb - UX Design Lead)
- Jennifer Kim (Amazon - DevOps Engineer)
- David Thompson (TechFlow Solutions - CEO)
- Lisa Wang (Spotify - Mobile Developer)
- Robert Martinez (Cisco - Cybersecurity Architect)
- Emily Davis (HubSpot - Marketing Director)
- Michael Brown (Stripe - Backend Engineer)

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/signup         # User registration
POST /api/auth/logout         # User logout
GET  /api/auth/me            # Get current user
```

### Mentee Endpoints
```
GET    /api/mentee/profile    # Get mentee profile
PUT    /api/mentee/profile    # Update mentee profile
GET    /api/mentee/dashboard  # Get dashboard data
GET    /api/mentee/sessions   # Get mentee sessions
POST   /api/mentee/sessions   # Create new session
```

### Mentor Endpoints
```
GET    /api/mentor/profile    # Get mentor profile
PUT    /api/mentor/profile    # Update mentor profile
GET    /api/mentor/dashboard  # Get mentor dashboard
GET    /api/mentor/sessions   # Get mentor sessions
PUT    /api/mentor/sessions/:id # Update session
```

### General Endpoints
```
GET    /api/mentors          # Get all mentors
GET    /api/mentors/:id      # Get specific mentor
POST   /api/sessions         # Create session
GET    /api/dashboard        # Get dashboard data
```

## 🗄 Database Schema

### Main Database Tables

**users**
```sql
- id (PRIMARY KEY)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, HASHED)
- role (ENUM: 'mentee', 'mentor')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**sessions**
```sql
- id (PRIMARY KEY)
- mentor_id (FOREIGN KEY)
- mentee_id (FOREIGN KEY)
- scheduled_start (DATETIME)
- duration_minutes (INT)
- status (ENUM: 'scheduled', 'completed', 'cancelled')
- meeting_link (VARCHAR)
- created_at (TIMESTAMP)
```

### Mentor Database Tables

**mentor_profiles**
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- title (VARCHAR)
- company (VARCHAR)
- bio (TEXT)
- expertise (JSON)
- years_experience (INT)
- availability (JSON)
- avatar (VARCHAR)
```

### Mentee Database Tables

**mentee_profiles**
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- college (VARCHAR)
- course (VARCHAR)
- skills (JSON)
- interests (JSON)
- career_goals (TEXT)
- avatar (VARCHAR)
```

## 🤝 Contributing

We welcome contributions to MentorVerse! Here's how you can help:

### Development Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** (if applicable)
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- Use TypeScript for frontend development
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add comments for complex logic
- Ensure responsive design for all new components

### Testing

- Test all new features thoroughly
- Ensure mobile responsiveness
- Verify database operations
- Test API endpoints with various inputs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Jitsi Meet** for video conferencing capabilities
- **Tailwind CSS** for the beautiful, responsive design system
- **React** and **TypeScript** communities for excellent documentation
- **MySQL** for reliable database management
- **Node.js** and **Express** for robust backend framework

## 📞 Support

For support, email support@mentorverse.com or join our community Discord server.

## 🔮 Future Enhancements

- **Mobile App**: Native iOS and Android applications
- **AI Chat Assistant**: Intelligent chatbot for instant help
- **Group Sessions**: Multi-participant mentoring sessions
- **Payment Integration**: Paid mentoring sessions
- **Advanced Analytics**: Detailed insights and reporting
- **Certification System**: Mentor certification and badges
- **Integration APIs**: Third-party integrations (LinkedIn, GitHub)
- **Offline Mode**: Basic functionality without internet

---

**Built with ❤️ by the MentorVerse Team**

*Connecting minds, building futures.*