import React, { useState, useEffect, useCallback } from 'react';
import { HomePage } from './components/HomePage';
import { Dashboard } from './components/Dashboard';
import { VideoCallPage } from './components/VideoCallPage';
import { MentorDashboard } from './components/MentorDashboard';
import { MentorDashboardNew } from './components/MentorDashboardNew';

import { mentorProfileService } from './services/mentorProfileService';
import type { Mentor, BookedSession, BookSessionHandler, MenteeProfile, MatchmakingProfile, MentorProfile, UserRole, DashboardView, MentorDashboardView } from './types';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { SplashScreen } from './components/SplashScreen';
import { NavigationBar } from './components/NavigationBar';
import { Logo } from './components/icons/Logo';
import { apiService } from './services/api';

type Page = 'home' | 'dashboard' | 'mentor-dashboard' | 'video-call';
type AuthPage = 'login' | 'signup';

const createDefaultMenteeProfile = (): MenteeProfile => ({
  id: '',
  name: '',
  email: '',
  role: 'mentee',
  college: '',
  course: '',
  title: '',
  bio: '',
  experience: '',
  interests: [],
  skills: [],
  avatar: '',
});

const createDefaultMatchmakingProfile = (): MatchmakingProfile => ({
  currentSkills: '',
  desiredSkills: '',
  careerGoals: '',
  industryInterests: '',
});

const createDefaultMentorProfile = (): MentorProfile => ({
  id: '',
  name: '',
  email: '',
  role: 'mentor',
  title: '',
  company: '',
  bio: '',
  experience: '',
  expertise: [],
  linkedin: '',
  avatar: '',
  yearsOfExperience: 0,
  availability: {},
  updatedAt: new Date().toISOString(),
});

const UnauthenticatedHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const scrollToRoleSelection = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    document.getElementById('role-selection')?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="#" className="flex items-center gap-2 cursor-pointer">
            <Logo className="h-6 w-6 sm:h-8 sm:w-8 text-brand-accent" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">MentorVerse</h1>
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-300 hover:text-brand-accent transition-colors">Features</a>
            <a href="#about" className="text-sm font-semibold text-slate-300 hover:text-brand-accent transition-colors">About</a>
          </nav>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden sm:flex items-center gap-4">
            <button onClick={scrollToRoleSelection} className="text-sm font-semibold text-slate-300 hover:text-brand-accent transition-colors">
              Login
            </button>
            <button
              onClick={scrollToRoleSelection}
              className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white bg-brand-primary hover:bg-brand-secondary transition-colors"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden text-slate-300 hover:text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-700 py-4">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-sm font-semibold text-slate-300 hover:text-brand-accent transition-colors">Features</a>
              <a href="#about" className="text-sm font-semibold text-slate-300 hover:text-brand-accent transition-colors">About</a>
              <button onClick={scrollToRoleSelection} className="text-left text-sm font-semibold text-slate-300 hover:text-brand-accent transition-colors">
                Login
              </button>
              <button
                onClick={scrollToRoleSelection}
                className="w-full text-left px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white bg-brand-primary hover:bg-brand-secondary transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isExitingSplash, setIsExitingSplash] = useState(false);

  useEffect(() => {
    // Start exit animation after a delay
    const exitTimer = setTimeout(() => {
      setIsExitingSplash(true);
    }, 4500); // Hold for ~4.5s, then start fade

    // Remove component from DOM after animation finishes
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 5000); // Total splash time is 5s

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [authRole, setAuthRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<{ id: string; name: string; email: string; role: UserRole; avatar?: string } | null>(null);

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [dashboardView, setDashboardView] = useState<DashboardView>('selection');
  const [mentorDashboardView, setMentorDashboardView] = useState<MentorDashboardView>('sessions');

  const activateSession = useCallback(async (user: { id: string; name: string; email: string; role: UserRole; avatar?: string }, skipProfileSetup: boolean = false) => {
    console.log('Activating session for user:', user);
    
    localStorage.setItem('authUser', JSON.stringify(user));
    setUserData(user);
    setIsAuthenticated(true);
    setUserRole(user.role);
    
    // Navigate immediately to prevent freezing
    if (user.role === 'mentor') {
      setCurrentPage('mentor-dashboard');
      setMentorDashboardView('sessions'); // Set a default view
      
      // Create a basic mentor profile immediately
      const basicProfile = createDefaultMentorProfile();
      basicProfile.id = user.id;
      basicProfile.name = user.name;
      basicProfile.email = user.email;
      basicProfile.role = 'mentor';
      setMentorProfile(basicProfile);
      
      // Try to load real profile in background (non-blocking)
      setTimeout(async () => {
        try {
          console.log('Loading mentor profile in background...');
          const existingProfile = await mentorProfileService.getProfile();
          setMentorProfile(existingProfile);
          console.log('Mentor profile loaded successfully');
        } catch (error) {
          console.warn('Could not load mentor profile, using default:', error);
          // Keep the basic profile we already set
        }
      }, 500); // Delay to ensure navigation completes first
    } else {
      setCurrentPage('dashboard');
      setDashboardView('selection');
    }
    
    setAuthRole(null);
    setAuthPage('login');
    
    console.log('Session activation completed');
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = apiService.getToken();
      const storedUser = localStorage.getItem('authUser');

      if (!token) {
        localStorage.removeItem('authUser');
        return;
      }

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as { id: string; name: string; email: string; role: UserRole };
          activateSession(parsedUser);
          return;
        } catch {
          localStorage.removeItem('authUser');
        }
      }

      try {
        const response = await apiService.getCurrentUser();
        await activateSession(response.user, false); // Check profile for existing users too
      } catch {
        apiService.clearToken();
        localStorage.removeItem('authUser');
      }
    };

    initializeAuth();
  }, [activateSession]);

  const [otherParticipant, setOtherParticipant] = useState<Mentor | null>(null);
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);
  const [menteeProfile, setMenteeProfile] = useState<MenteeProfile>(createDefaultMenteeProfile());
  const [mentorProfile, setMentorProfile] = useState<MentorProfile>(createDefaultMentorProfile());
  const [matchmakingProfile, setMatchmakingProfile] = useState<MatchmakingProfile>(createDefaultMatchmakingProfile());

  const userId = userData?.id;

  useEffect(() => {
    if (!isAuthenticated) {
      setMenteeProfile(createDefaultMenteeProfile());
      setMatchmakingProfile(createDefaultMatchmakingProfile());
      setBookedSessions([]);
      return;
    }
    let isActive = true;
    const loadAccountData = async () => {
      try {
        const [profileResponse, sessionsResponse] = await Promise.all([
          apiService.getProfile(),
          apiService.getSessions(),
        ]);
        if (!isActive) {
          return;
        }
        const profileData = profileResponse.user;
        const normalizedProfile: MenteeProfile = {
          id: profileData.id || '',
          name: profileData.name || '',
          email: profileData.email || '',
          role: profileData.role as UserRole,
          college: profileData.college || '',
          course: profileData.course || '',
          title: profileData.title || '',
          bio: profileData.bio || '',
          experience: profileData.experience || '',
          interests: Array.isArray(profileData.interests) ? profileData.interests : [],
          skills: Array.isArray(profileData.skills) ? profileData.skills : [],
          avatar: profileData.avatar || '',
        };
        setMenteeProfile(normalizedProfile);
        setBookedSessions([...sessionsResponse].sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()));
        if (normalizedProfile.id) {
          const updatedUserInfo = {
            id: normalizedProfile.id,
            name: normalizedProfile.name,
            email: normalizedProfile.email,
            role: normalizedProfile.role,
            avatar: normalizedProfile.avatar,
          };
          setUserData(updatedUserInfo);
          localStorage.setItem('authUser', JSON.stringify(updatedUserInfo));
        }
      } catch (error) {
        console.error('Failed to load account data', error);
      }
    };
    loadAccountData();
    return () => {
      isActive = false;
    };
  }, [isAuthenticated, userId]);

  // Auth Handlers
  const handleLogin = async (user: { id: string; name: string; email: string; role: UserRole; avatar?: string }) => {
    await activateSession(user);
  };

  const handleSignup = async (user: { id: string; name: string; email: string; role: UserRole; avatar?: string }) => {
    await activateSession(user);
  };

  const handleLogout = () => {
    apiService.logout();
    localStorage.removeItem('authUser');
    setUserData(null);
    setIsAuthenticated(false);
    setCurrentPage('home');
    setUserRole(null);
    setDashboardView('selection');
    setMentorDashboardView('selection');
    setAuthRole(null);
    setAuthPage('login');
    setMenteeProfile(createDefaultMenteeProfile());
    setMentorProfile(createDefaultMentorProfile());
    setMatchmakingProfile(createDefaultMatchmakingProfile());
    setBookedSessions([]);
  };
  
  const handleSelectAuthRole = (role: UserRole) => {
    setAuthRole(role);
  };
  
  const handleBackToRoleSelection = () => {
    setAuthRole(null);
    setAuthPage('login');
  };

  const handleUpdateMenteeProfile = async (profile: MenteeProfile): Promise<MenteeProfile> => {
    try {
      const response = await apiService.updateProfile({
        name: profile.name,
        email: profile.email,
        title: profile.title,
        college: profile.college,
        course: profile.course,
        bio: profile.bio,
        experience: profile.experience,
        interests: profile.interests,
        skills: profile.skills,
        avatar: profile.avatar,
      });
      const updated: MenteeProfile = {
        id: response.user.id || '',
        name: response.user.name || '',
        email: response.user.email || '',
        role: response.user.role as UserRole,
        college: response.user.college || '',
        course: response.user.course || '',
        title: response.user.title || '',
        bio: response.user.bio || '',
        experience: response.user.experience || '',
        interests: Array.isArray(response.user.interests) ? response.user.interests : [],
        skills: Array.isArray(response.user.skills) ? response.user.skills : [],
        avatar: response.user.avatar || '',
      };
      setMenteeProfile(updated);
      if (!userData || userData.id === updated.id) {
        const updatedUser = {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          avatar: updated.avatar,
        };
        setUserData(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
      return updated;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update profile');
    }
  };

  const handleUpdateMatchmakingProfile = (profile: MatchmakingProfile) => {
    setMatchmakingProfile(profile);
  };

  const handleUpdateMentorProfile = async (profile: Partial<MentorProfile>): Promise<MentorProfile> => {
    try {
      // Merge the updates with existing profile data
      const updateData = {
        ...profile,
        // Ensure all fields are included if they exist
        ...(profile.name && { name: profile.name }),
        ...(profile.title && { title: profile.title }),
        ...(profile.company && { company: profile.company }),
        ...(profile.bio && { bio: profile.bio }),
        ...(profile.experience && { experience: profile.experience }),
        ...(profile.expertise && { expertise: profile.expertise }),
        ...(profile.linkedin && { linkedin: profile.linkedin }),
        ...(profile.yearsOfExperience !== undefined && { yearsOfExperience: profile.yearsOfExperience }),
        ...(profile.availability && { availability: profile.availability }),
        ...(profile.avatar && { avatar: profile.avatar }),
      };

      const updated = await mentorProfileService.updateProfile(updateData);
      
      // Merge updated data with existing profile to preserve all fields
      const mergedProfile = {
        ...mentorProfile,
        ...updated,
      };
      
      setMentorProfile(mergedProfile);
      
      // Update user data if name or avatar changed
      if (userData && (updated.name !== userData.name || updated.avatar !== userData.avatar)) {
        const updatedUser = {
          ...userData,
          name: updated.name,
          avatar: updated.avatar,
        };
        setUserData(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
      
      return updated;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update mentor profile');
    }
  };


  
  const [callRoomName, setCallRoomName] = useState<string | null>(null);

  const joinCall = (participant: Mentor) => {
    setOtherParticipant(participant);
    setCallRoomName(`MentorVerse-AdHoc-${participant.name.replace(/\s+/g, '')}`);
    setCurrentPage('video-call');
  };

  const joinSessionCall = (session: BookedSession) => {
    const link = session.meetingLink || '';
    const roomFromLink = link ? link.substring(link.lastIndexOf('/') + 1) : `MentorVerse-Session-${session.id}`;
    setCallRoomName(roomFromLink);
    setOtherParticipant(null);
    setCurrentPage('video-call');
  };

  const handleEndCall = () => {
    // Redirect to sessions view after call ends
    if (userRole === 'mentor') {
      setMentorDashboardView('sessions');
      setCurrentPage('mentor-dashboard');
    } else {
      setDashboardView('mentorship-hub');
      setCurrentPage('dashboard');
    }
    setOtherParticipant(null);
    setCallRoomName(null);
  };
  
  const handleBookSession: BookSessionHandler = async (sessionDetails) => {
    const newMentee: Mentor = {
      name: sessionDetails.menteeName,
      title: 'Aspiring Professional',
      company: sessionDetails.menteeEmail,
      expertise: [],
      matchReasoning: sessionDetails.reason,
      email: sessionDetails.menteeEmail,
    };

    try {
      const createdSession = await apiService.createSession({
        mentor: sessionDetails.mentor,
        mentee: newMentee,
        reason: sessionDetails.reason,
        scheduledStart: sessionDetails.scheduledStart,
        durationMinutes: sessionDetails.durationMinutes,
      });
      setBookedSessions((prev) => {
        const next = [createdSession, ...prev];
        return next.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create session');
    }
  };
  
  const handleNavigation = (view: DashboardView | MentorDashboardView) => {
    if (userRole === 'mentee') {
      setDashboardView(view as DashboardView);
    } else if (userRole === 'mentor') {
      setMentorDashboardView(view as MentorDashboardView);
    }
  };

  if (showSplash) {
    return <SplashScreen isExiting={isExitingSplash} />;
  }

  const isVideoCallActive = currentPage === 'video-call' && isAuthenticated;
  const navigationAvatar = userRole === 'mentee' ? menteeProfile.avatar : undefined;
  
  const backgroundClass = isVideoCallActive ? 'bg-black' : 'bg-transparent';

  if (!isAuthenticated) {
    return (
      <div className="relative bg-space-dark">
        <div className="absolute inset-0 stars-bg z-0"></div>
        <div className="relative z-10">
          <UnauthenticatedHeader />
          {!authRole ? (
            <HomePage onSelectRole={handleSelectAuthRole} />
          ) : authPage === 'login' ? (
            <LoginPage 
              role={authRole}
              onLogin={handleLogin} 
              onSwitchToSignup={() => setAuthPage('signup')}
              onBack={handleBackToRoleSelection} 
            />
          ) : (
            <SignupPage 
              role={authRole}
              onSignup={handleSignup} 
              onSwitchToLogin={() => setAuthPage('login')}
              onBack={handleBackToRoleSelection}
            />
          )}
        </div>
      </div>
    );
  }

  const renderAuthenticatedContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard view={dashboardView} setView={setDashboardView} onJoinCall={joinCall} onJoinSessionCall={joinSessionCall} onBookSession={handleBookSession} sessions={bookedSessions} menteeProfile={menteeProfile} onUpdateMenteeProfile={handleUpdateMenteeProfile} matchmakingProfile={matchmakingProfile} onUpdateMatchmakingProfile={handleUpdateMatchmakingProfile} />;
      case 'mentor-dashboard':
        return <MentorDashboardNew view={mentorDashboardView} setView={setMentorDashboardView} onJoinSessionCall={joinSessionCall} sessions={bookedSessions} mentorProfile={mentorProfile} onUpdateMentorProfile={handleUpdateMentorProfile} />;

      case 'video-call':
        return callRoomName ? <VideoCallPage roomName={callRoomName} onEndCall={handleEndCall} /> : <div>Error: Room not found.</div>;
      default:
        return userRole === 'mentor'
          ? <MentorDashboardNew view={mentorDashboardView} setView={setMentorDashboardView} onJoinSessionCall={joinSessionCall} sessions={bookedSessions} mentorProfile={mentorProfile} onUpdateMentorProfile={handleUpdateMentorProfile} />
          : <Dashboard view={dashboardView} setView={setDashboardView} onJoinCall={joinCall} onJoinSessionCall={joinSessionCall} onBookSession={handleBookSession} sessions={bookedSessions} menteeProfile={menteeProfile} onUpdateMenteeProfile={handleUpdateMenteeProfile} matchmakingProfile={matchmakingProfile} onUpdateMatchmakingProfile={handleUpdateMatchmakingProfile} />;
    }
  };

  if (isVideoCallActive) {
    return (
      <div className="text-gray-200 antialiased bg-black h-screen flex flex-col">
        <main className="flex-grow">
          {renderAuthenticatedContent()}
        </main>
      </div>
    );
  }



  return (
    <div className="text-gray-200 antialiased">
      <NavigationBar
        userRole={userRole}
        currentView={userRole === 'mentee' ? dashboardView : mentorDashboardView}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
        userName={userData?.name}
        userEmail={userData?.email}
        userAvatar={navigationAvatar}
      >
        <main>
          {renderAuthenticatedContent()}
        </main>
        <footer className="text-center py-6 sm:py-8 bg-slate-900/50 text-slate-500 text-sm border-t border-slate-700">
          <div className="container mx-auto px-4">
            <p>&copy; {new Date().getFullYear()} MentorVerse. All rights reserved.</p>
          </div>
        </footer>
      </NavigationBar>
    </div>
  );
}

export default App;