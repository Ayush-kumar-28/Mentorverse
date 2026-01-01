# MentorVerse Deployment Guide

## MongoDB Atlas Setup

Your MongoDB Atlas cluster is configured with:
- **Cluster**: mentorverse-cluster.vliph7u.mongodb.net
- **Username**: mentorverse_user
- **Password**: Ayushkumar28

### Three Databases Created:
1. **mentorverse_main** - Main application database
2. **mentorverse_mentors** - Mentor-specific features and data
3. **mentorverse_mentees** - Mentee-specific features and data

## Render Deployment

### Backend Deployment:
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following environment variables in Render dashboard:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://mentorverse_user:Ayushkumar28@mentorverse-cluster.vliph7u.mongodb.net/mentorverse_main?retryWrites=true&w=majority&appName=mentorverse-cluster
MENTOR_MONGODB_URI=mongodb+srv://mentorverse_user:Ayushkumar28@mentorverse-cluster.vliph7u.mongodb.net/mentorverse_mentors?retryWrites=true&w=majority&appName=mentorverse-cluster
MENTEE_MONGODB_URI=mongodb+srv://mentorverse_user:Ayushkumar28@mentorverse-cluster.vliph7u.mongodb.net/mentorverse_mentees?retryWrites=true&w=majority&appName=mentorverse-cluster
JWT_SECRET=your_secure_jwt_secret_at_least_32_characters_long
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-url.onrender.com
```

4. Build Command: `cd backend && npm install`
5. Start Command: `cd backend && npm start`
6. Health Check Path: `/api/health`

### Frontend Deployment:
1. Create a new Static Site on Render
2. Set environment variables:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Build Command: `cd frontend && npm install && npm run build`
4. Publish Directory: `./frontend/dist`

## Important Notes:

1. **JWT Secret**: Generate a secure JWT secret (at least 32 characters)
2. **Gemini API Key**: Get your API key from Google AI Studio
3. **CORS**: Frontend URL is automatically configured for Render domains
4. **Health Check**: Backend includes `/api/health` endpoint for monitoring
5. **Database Separation**: Three separate databases for different user types

## Manual Steps After Deployment:

1. Update FRONTEND_URL in backend environment with actual frontend URL
2. Update VITE_API_URL in frontend environment with actual backend URL
3. Test all three database connections
4. Populate demo data using: `npm run populate-demo`

## Monitoring:

- Backend health: `https://your-backend-url.onrender.com/api/health`
- API docs: `https://your-backend-url.onrender.com/api/docs`