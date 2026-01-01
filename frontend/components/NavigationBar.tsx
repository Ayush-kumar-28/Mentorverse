import React, { useEffect, useRef, useState } from 'react';
import type { UserRole, DashboardView, MentorDashboardView } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { UsersIcon } from './icons/UsersIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClockIcon } from './icons/ClockIcon';
import { HomeIcon } from './icons/HomeIcon';
import { BellIcon } from './icons/BellIcon';
import { BookIcon } from './icons/BookIcon';
import { NotificationPopover, type Notification } from './NotificationPopover';

interface NavLinkProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
      }`}
  >
    {children}
  </button>
);

interface NavigationBarProps {
  userRole: UserRole | null;
  currentView: DashboardView | MentorDashboardView;
  onNavigate: (view: DashboardView | MentorDashboardView) => void;
  onLogout: () => void;
  userName?: string | null;
  userEmail?: string | null;
  userAvatar?: string | null;
  children?: React.ReactNode;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ userRole, currentView, onNavigate, onLogout, userName, userEmail, userAvatar, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const menteeLinks = [
    { view: 'selection', label: 'Dashboard', icon: <HomeIcon /> },
    { view: 'ai-match', label: 'Smart Match', icon: <SparklesIcon /> },
    { view: 'browse-mentors', label: 'Browse', icon: <UsersIcon /> },
    { view: 'mentorship-hub', label: 'My Sessions', icon: <ClockIcon /> },
    { view: 'doubt-room', label: 'Doubt Room', icon: <LightbulbIcon /> },
    { view: 'workshops', label: 'Workshops', icon: <BookIcon /> },
  ];

  const mentorLinks = [
    { view: 'selection', label: 'Dashboard', icon: <HomeIcon /> },
    { view: 'sessions', label: 'My Sessions', icon: <ClockIcon /> },
    { view: 'profile', label: 'Profile', icon: <CalendarIcon /> },
  ];

  const links = userRole === 'mentee' ? menteeLinks : mentorLinks;
  const dashboardHomeView = userRole === 'mentee' ? 'selection' : 'selection';

  const fallbackName = userRole === 'mentor' ? 'Maya Singh' : 'Alex Doe';
  const displayName = userName?.trim() ? userName : fallbackName;
  const displayEmail = userEmail?.trim() ? userEmail : null;
  const profileInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  const sanitizedAvatar = userAvatar && userAvatar.trim().length > 0 ? userAvatar : null;
  const avatarAlt = `${displayName} avatar`;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileSectionRef = useRef<HTMLDivElement>(null);

  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Upcoming Workshop: Mastering React.js',
      message: 'Don\'t miss the workshop on React.js advanced patterns starting tomorrow at 10:00 AM.',
      time: 'Tomorrow, 10:00 AM',
      type: 'workshop',
      read: false
    },
    {
      id: '2',
      title: 'Session Reminder',
      message: 'You have a mentorship session with Sarah Chen coming up in 2 hours.',
      time: 'Today, 2:00 PM',
      type: 'session',
      read: false
    },
    {
      id: '3',
      title: 'New Workshop Available',
      message: 'Public Speaking Skills workshop has been added to the schedule.',
      time: 'Dec 20, 2:00 PM',
      type: 'workshop',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleProfileClick = () => {
    if (userRole === 'mentee') {
      onNavigate('my-profile');
    } else if (userRole === 'mentor') {
      onNavigate('profile');
    }
  };

  const handleProfileMenuToggle = () => {
    setIsProfileMenuOpen((prev) => !prev);
    setIsNotificationsOpen(false); // Close notifications if opening profile
  };

  const handleNotificationToggle = () => {
    setIsNotificationsOpen((prev) => !prev);
    setIsProfileMenuOpen(false); // Close profile if opening notifications
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleProfileOptionSelect = (action: 'profile' | 'logout') => {
    setIsProfileMenuOpen(false);
    if (action === 'profile') {
      handleProfileClick();
      return;
    }
    onLogout();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileSectionRef.current && !profileSectionRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="h-screen bg-slate-900 flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar - Desktop & Mobile Slide-out */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:relative z-50 lg:z-auto
        w-64 bg-slate-800 border-r border-slate-700 
        flex flex-col h-full
        transition-transform duration-300 ease-in-out
      `}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links - Evenly Spaced */}
        <nav className="flex flex-col justify-evenly h-full p-4 pt-0 lg:pt-4">
          {links.map(link => (
            <NavLink
              key={link.view}
              isActive={currentView === link.view}
              onClick={() => {
                onNavigate(link.view as DashboardView | MentorDashboardView);
                setIsMobileMenuOpen(false);
              }}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Right Side - Unified Scrollable Area */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full">
          {/* Top Header Bar - Fixed at Top */}
          <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40" style={{ height: '70px' }}>
            <div className="flex justify-between items-center px-4 sm:px-6 h-full">
              {/* Mobile Menu Button & Logo */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden text-slate-400 hover:text-white p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* MentorVerse Logo */}
                <div
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => onNavigate(dashboardHomeView as DashboardView | MentorDashboardView)}
                  aria-label="Go to dashboard"
                >
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-white">
                    MentorVerse
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification Bell */}
                <div ref={notificationRef} className="relative">
                  <button
                    type="button"
                    onClick={handleNotificationToggle}
                    className={`relative p-2 rounded-lg transition-colors ${isNotificationsOpen ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    aria-label="Notifications"
                  >
                    <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    {/* Notification dot */}
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </button>
                  {isNotificationsOpen && (
                    <NotificationPopover
                      notifications={notifications}
                      onClose={() => setIsNotificationsOpen(false)}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  )}
                </div>

                <div ref={profileSectionRef} className="relative z-[10000]">
                  <button
                    type="button"
                    onClick={handleProfileMenuToggle}
                    className={`flex items-center justify-center rounded-full border ${sanitizedAvatar ? 'border-brand-primary/80 bg-transparent overflow-hidden' : 'border-brand-primary bg-brand-primary/20 text-brand-accent font-semibold text-sm'} focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-slate-900`}
                    style={{ height: '36px', width: '36px' }}
                    aria-label="Profile options"
                  >
                    {sanitizedAvatar ? (
                      <img src={sanitizedAvatar} alt={avatarAlt} className="h-full w-full object-cover" />
                    ) : (
                      profileInitials
                    )}
                  </button>
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-700 bg-slate-800 py-2 shadow-xl z-[9999]">
                      <div className="px-4 pb-2 mb-2 border-b border-slate-700">
                        <div className="text-sm font-semibold text-slate-100 truncate">{displayName}</div>
                        {displayEmail && <div className="text-xs text-slate-400 truncate">{displayEmail}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleProfileOptionSelect('profile')}
                        className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                      >
                        Update profile
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProfileOptionSelect('logout')}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                      >
                        <LogoutIcon />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};