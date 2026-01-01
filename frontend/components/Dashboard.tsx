import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { MenteeProfile, MatchmakingProfile, Mentor, BookSessionHandler, BookedSession, Doubt, ChatMessage as ChatMessageType, DashboardView } from '../types';
import { SmartMatchForm } from './SmartMatchForm';
import { MentorRecommendations } from './MentorRecommendations';
import { findMentors } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ClockIcon } from './icons/ClockIcon';
import { allMentors } from '../data/mentors';
import { apiService } from '../services/api';
import type { DoubtResponse } from '../services/api';
import { MentorCard } from './MentorCard';
import { MentorshipHub } from './MenteeDashboard';
import { Chatbot } from './Chatbot';
import { MenteeProfileView } from './MenteeProfileView';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { DoubtRoomView } from './DoubtRoomView';
import { DoubtSessionPage } from './DoubtSessionPage';
import { dashboardService, type DashboardStats, type MonthlyActivity, type FavoriteMentor } from '../services/dashboardService';

const messageRoles: ChatMessageType['role'][] = ['user', 'model', 'other'];

const normalizeMessage = (message: DoubtResponse['messages'][number]): ChatMessageType => {
    const role = messageRoles.includes(message.role) ? message.role : 'other';
    const base: ChatMessageType = {
        role,
        text: message.text,
    };
    if (message.author) {
        base.author = message.author;
    }
    return base;
};

const normalizeDoubtResponse = (raw: DoubtResponse): Doubt => {
    const messages = raw.messages.map(normalizeMessage);
    const base: Doubt = {
        id: raw.id,
        title: raw.title,
        description: raw.description,
        author: raw.author,
        participants: raw.participants,
        messages,
    };
    if (raw.imageUrl) {
        base.imageUrl = raw.imageUrl;
    }
    return base;
};

interface DashboardProps {
    view: DashboardView;
    setView: (view: DashboardView) => void;
    onJoinCall: (mentor: Mentor) => void;
    onJoinSessionCall: (session: BookedSession) => void;
    onBookSession: BookSessionHandler;
    sessions: BookedSession[];
    menteeProfile: MenteeProfile;
    onUpdateMenteeProfile: (profile: MenteeProfile) => Promise<MenteeProfile>;
    matchmakingProfile: MatchmakingProfile;
    onUpdateMatchmakingProfile: (profile: MatchmakingProfile) => void;
}

const SelectionCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
}> = ({ title, description, icon, onClick }) => (
    <div
        onClick={onClick}
        className="group relative block p-6 bg-slate-800 rounded-xl shadow-lg border border-slate-700 cursor-pointer transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:border-brand-primary/50"
    >
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-brand-light text-brand-accent group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                {icon}
            </div>
            <div className="text-left">
                <h3 className="text-lg font-bold text-slate-100">{title}</h3>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>
        </div>
        <div className="absolute top-4 right-4 text-slate-500 group-hover:text-brand-accent group-hover:translate-x-1 transition-all duration-300">
            <ArrowRightIcon />
        </div>
    </div>
);


const AiMatchView: React.FC<{ 
    onJoinCall: (mentor: Mentor) => void; 
    onBookSession: BookSessionHandler; 
    onBrowseAll: () => void;
    onNavigateToSessions?: () => void;
    initialProfile: MenteeProfile;
    onUpdateMenteeProfile: (profile: MenteeProfile) => Promise<MenteeProfile>;
    initialMatchmakingProfile: MatchmakingProfile;
    onUpdateMatchmakingProfile: (profile: MatchmakingProfile) => void;
}> = ({ onJoinCall, onBookSession, onBrowseAll, onNavigateToSessions, initialProfile, onUpdateMenteeProfile, initialMatchmakingProfile, onUpdateMatchmakingProfile }) => {
    const [recommendedMentors, setRecommendedMentors] = useState<Mentor[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleProfileSubmit = useCallback(async (profile: MatchmakingProfile) => {
        setIsLoading(true);
        setError(null);
        setRecommendedMentors([]);
        onUpdateMatchmakingProfile(profile);
        try {
            const mentors = await findMentors(profile, allMentors);
            setRecommendedMentors(mentors);
        } catch (err) {
            console.error(err);
            setError('Sorry, we couldn\'t find mentors at this time. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [onUpdateMatchmakingProfile]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
            <div className="lg:col-span-1">
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 sticky top-28">
                    <SmartMatchForm
                        onSubmit={handleProfileSubmit}
                        isLoading={isLoading}
                        initialProfile={initialMatchmakingProfile}
                    />
                </div>
            </div>
            <div className="lg:col-span-2">
                <MentorRecommendations
                    mentors={recommendedMentors}
                    isLoading={isLoading}
                    error={error}
                    onJoinCall={onJoinCall}
                    onBookSession={onBookSession}
                    onNavigateToSessions={onNavigateToSessions}
                    onBrowseAll={onBrowseAll}
                />
            </div>
        </div>
    );
};

const BrowseMentorsView: React.FC<{ onJoinCall: (mentor: Mentor) => void; onBookSession: BookSessionHandler; onNavigateToSessions?: () => void; }> = ({ onJoinCall, onBookSession, onNavigateToSessions }) => {
    const [newMentors, setNewMentors] = useState<any[]>([]);
    const [allMentorsData, setAllMentorsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadMentors = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Import mentorsService dynamically to avoid circular imports
                const { mentorsService } = await import('../services/mentorsService');
                
                // Get new mentors (last 7 days) and all mentors separately
                const [newMentorsResponse, allMentorsResponse] = await Promise.all([
                    mentorsService.getNewMentors(10, 7), // Get top 10 new mentors from database
                    mentorsService.getMentors({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }) // Get all mentors from database
                ]);
                
                setNewMentors(newMentorsResponse.newMentors);
                setAllMentorsData(allMentorsResponse.mentors);
            } catch (err) {
                console.error('Failed to load mentors:', err);
                setError('Failed to load mentors from database. Please check your connection.');
                // Don't fallback to static data - only show database mentors
                setNewMentors([]);
                setAllMentorsData([]);
            } finally {
                setLoading(false);
            }
        };

        loadMentors();
    }, []);

    if (loading) {
        return (
            <div className="animate-fade-in">
                <h2 className="text-3xl font-bold text-slate-100 mb-2">Explore Our Mentors</h2>
                <p className="text-lg text-slate-400 mb-8">Find the right guide for your journey from our community of experts.</p>
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
         <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-100 mb-2">Explore Our Mentors</h2>
            <p className="text-lg text-slate-400 mb-8">Find the right guide for your journey from our community of experts.</p>
            
            {error && (
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-200">
                    <p className="text-sm">⚠️ {error}</p>
                </div>
            )}

            {/* New Mentors Section - Only show database mentors */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-xl font-bold text-slate-100">New Mentors</h3>
                    <span className="px-3 py-1 bg-green-600/20 text-green-300 rounded-full text-xs font-medium">
                        Recently Joined
                    </span>
                </div>
                {newMentors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {newMentors.map((mentorData, index) => {
                            // Convert API mentor data to Mentor interface
                            const mentor: Mentor = {
                                name: mentorData.name,
                                title: mentorData.title,
                                company: mentorData.company,
                                expertise: mentorData.expertise,
                                bio: mentorData.bio,
                                email: mentorData.email,
                                linkedin: mentorData.linkedin,
                                availability: mentorData.availability || {},
                                avatar: mentorData.avatar || ''
                            };
                            
                            return (
                                <MentorCard 
                                    key={mentorData.id} 
                                    mentor={mentor} 
                                    index={index} 
                                    onJoinCall={onJoinCall} 
                                    onBookSession={onBookSession}
                                    onNavigateToSessions={onNavigateToSessions}
                                    isNew={true}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center mb-8">
                        <div className="text-slate-400 mb-3">
                            <svg className="w-12 h-12 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">No New Mentors</h4>
                        <p className="text-slate-500 text-xs">
                            No mentors have joined in the last 7 days. Check back later!
                        </p>
                    </div>
                )}
            </div>

            {/* All Mentors Section - Exclude mentors already shown in New Mentors */}
            <div>
                <h3 className="text-xl font-bold text-slate-100 mb-4">Other Mentors</h3>
                {(() => {
                    // Get IDs of new mentors to exclude them from all mentors
                    const newMentorIds = new Set(newMentors.map(mentor => mentor.id));
                    
                    // Filter out new mentors from all mentors list
                    const remainingMentors = allMentorsData.filter(mentor => !newMentorIds.has(mentor.id));
                    
                    return remainingMentors.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {remainingMentors.map((mentorData, index) => {
                                // Convert API mentor data to Mentor interface
                                const mentor: Mentor = {
                                    name: mentorData.name,
                                    title: mentorData.title,
                                    company: mentorData.company,
                                    expertise: mentorData.expertise,
                                    bio: mentorData.bio,
                                    email: mentorData.email,
                                    linkedin: mentorData.linkedin,
                                    availability: mentorData.availability || {},
                                    avatar: mentorData.avatar || ''
                                };
                                
                                return (
                                    <MentorCard 
                                        key={mentorData.id} 
                                        mentor={mentor} 
                                        index={index} 
                                        onJoinCall={onJoinCall} 
                                        onBookSession={onBookSession}
                                        onNavigateToSessions={onNavigateToSessions}
                                        isNew={false} // These are not new mentors
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center">
                            <div className="text-slate-400 mb-3">
                                <svg className="w-12 h-12 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-medium text-slate-300 mb-2">All mentors are new!</h4>
                            <p className="text-slate-500 text-xs">
                                All available mentors are shown in the "New Mentors" section above.
                            </p>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = ({ view, setView, onJoinCall, onJoinSessionCall, onBookSession, sessions, menteeProfile, onUpdateMenteeProfile, matchmakingProfile, onUpdateMatchmakingProfile }) => {
    const handleNavigateToSessions = () => {
        setView('mentorship-hub');
    };
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [doubtsLoading, setDoubtsLoading] = useState<boolean>(false);
    const [doubtsError, setDoubtsError] = useState<string | null>(null);
    const [activeDoubt, setActiveDoubt] = useState<Doubt | null>(null);

    // Dashboard API state
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [monthlyActivityData, setMonthlyActivityData] = useState<MonthlyActivity[]>([]);
    const [favoriteMentorsData, setFavoriteMentorsData] = useState<FavoriteMentor[]>([]);
    const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    // Load dashboard data from API
    const loadDashboardData = useCallback(async () => {
        if (view !== 'selection') return; // Only load for main dashboard view
        
        setDashboardLoading(true);
        setDashboardError(null);
        
        try {
            const [stats, monthlyActivity, favoriteMentors] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getMonthlyActivity(),
                dashboardService.getFavoriteMentors(4)
            ]);
            
            setDashboardStats(stats);
            setMonthlyActivityData(monthlyActivity);
            setFavoriteMentorsData(favoriteMentors);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
            
            // Only show error if we don't have local session data to fall back on
            if (sessions.length === 0) {
                // Make error messages more user-friendly
                if (errorMessage.includes('404')) {
                    setDashboardError('Dashboard service is not available. Using local data.');
                } else if (errorMessage.includes('Authentication')) {
                    setDashboardError('Please log in to view enhanced dashboard data.');
                } else if (errorMessage.includes('Network')) {
                    setDashboardError('Network error. Using local data.');
                } else {
                    setDashboardError('Unable to load enhanced data. Using local data.');
                }
            }
            // If we have sessions, silently fall back to local calculation without showing error
        } finally {
            setDashboardLoading(false);
        }
    }, [view, sessions.length]);

    // Calculate session statistics (fallback to local calculation if API data not available)
    const sessionStats = useMemo(() => {
        // Use API data if available
        if (dashboardStats) {
            return {
                completed: dashboardStats.completedSessions,
                upcoming: dashboardStats.upcomingSessions,
                progress: dashboardStats.progressPercentage
            };
        }
        
        // Fallback to local calculation
        const now = new Date();
        let sessionHistoryCount = 0; // All past sessions (session history)
        let upcomingCount = 0;
        let actuallyCompletedCount = 0; // Only sessions marked as completed
        
        sessions.forEach(session => {
            const sessionDate = new Date(session.scheduledStart);
            const isPastSession = sessionDate < now || session.status === 'completed' || session.status === 'cancelled';
            
            if (isPastSession) {
                // Count all past sessions for "Completed Sessions" display
                sessionHistoryCount++;
                
                // Count only actually completed sessions for progress calculation
                if (session.status === 'completed') {
                    actuallyCompletedCount++;
                }
            } else {
                upcomingCount++;
            }
        });
        
        // Calculate progress percentage (actually completed sessions out of total past sessions)
        const progressPercentage = sessionHistoryCount > 0 ? Math.round((actuallyCompletedCount / sessionHistoryCount) * 100) : 0;
        
        return {
            completed: sessionHistoryCount, // Use session history count for "Completed Sessions"
            upcoming: upcomingCount,
            progress: progressPercentage
        };
    }, [sessions, dashboardStats]);

    // Generate favorite mentors from session history (use API data when available)
    const favoriteMentors = useMemo(() => {
        // Use API data if available
        if (favoriteMentorsData.length > 0) {
            return favoriteMentorsData.map(apiMentor => ({
                mentor: {
                    name: apiMentor.mentor.name,
                    title: apiMentor.mentor.title,
                    company: apiMentor.mentor.company,
                    expertise: apiMentor.mentor.expertise,
                    email: apiMentor.mentor.email,
                    bio: '',
                    availability: {},
                    matchReasoning: '',
                    experience: []
                },
                sessionCount: apiMentor.sessionCount,
                lastSession: new Date(apiMentor.lastSessionDate)
            }));
        }
        
        // Fallback to local calculation
        const mentorSessionCount = new Map<string, { mentor: Mentor; sessionCount: number; lastSession: Date }>();
        const now = new Date();
        
        // Count sessions for each mentor (only past sessions)
        sessions.forEach(session => {
            const sessionDate = new Date(session.scheduledStart);
            const isPastSession = sessionDate < now || session.status === 'completed' || session.status === 'cancelled';
            
            if (isPastSession) {
                const mentorName = session.mentor.name;
                const existing = mentorSessionCount.get(mentorName);
                
                if (existing) {
                    existing.sessionCount++;
                    if (sessionDate > existing.lastSession) {
                        existing.lastSession = sessionDate;
                    }
                } else {
                    mentorSessionCount.set(mentorName, {
                        mentor: session.mentor,
                        sessionCount: 1,
                        lastSession: sessionDate
                    });
                }
            }
        });
        
        // Sort by session count (descending) and return top 4
        return Array.from(mentorSessionCount.values())
            .sort((a, b) => {
                // First sort by session count, then by most recent session
                if (b.sessionCount !== a.sessionCount) {
                    return b.sessionCount - a.sessionCount;
                }
                return b.lastSession.getTime() - a.lastSession.getTime();
            })
            .slice(0, 4);
    }, [sessions, favoriteMentorsData]);

    // Generate monthly chart data (use API data when available)
    const monthlyChartData = useMemo(() => {
        // Use API data if available (show last 6 months from API data)
        if (monthlyActivityData.length > 0) {
            return monthlyActivityData.slice(-6);
        }
        
        // Fallback to local calculation
        const monthlyData = new Map<string, { completed: number; upcoming: number; month: string; year: number }>();
        const now = new Date();
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });
            
            monthlyData.set(monthKey, {
                completed: 0,
                upcoming: 0,
                month: monthName,
                year: date.getFullYear()
            });
        }
        
        // Count sessions by month
        sessions.forEach(session => {
            const sessionDate = new Date(session.scheduledStart);
            const monthKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth()}`;
            const existing = monthlyData.get(monthKey);
            
            if (existing) {
                const isPastSession = sessionDate < now || session.status === 'completed' || session.status === 'cancelled';
                
                if (isPastSession) {
                    existing.completed++;
                } else {
                    existing.upcoming++;
                }
            }
        });
        
        return Array.from(monthlyData.values());
    }, [sessions, monthlyActivityData]);

    useEffect(() => {
        setDoubtsLoading(true);
        setDoubtsError(null);
        apiService
            .getDoubts()
            .then((response) => {
                setDoubts(response.map(normalizeDoubtResponse));
            })
            .catch((error) => {
                setDoubtsError(error instanceof Error ? error.message : 'Unable to load doubts right now.');
            })
            .finally(() => {
                setDoubtsLoading(false);
            });
    }, []);

    // Load dashboard data when view changes to selection
    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const handleJoinDoubt = (doubt: Doubt) => {
        setActiveDoubt(doubt);
        setView('doubt-room');
    };

    const handleLeaveDoubt = () => {
        setActiveDoubt(null);
    };
    
    useEffect(() => {
        if (view !== 'doubt-room') {
            handleLeaveDoubt();
        }
    }, [view]);

    const handleCreateDoubt = (title: string, description: string, imageUrl?: string) => {
        setDoubtsError(null);
        apiService
            .createDoubt({ title, description, imageUrl })
            .then((created) => {
                const normalized = normalizeDoubtResponse(created);
                setDoubts((prev) => [normalized, ...prev]);
                setActiveDoubt(normalized);
                setView('doubt-room');
            })
            .catch((error) => {
                setDoubtsError(error instanceof Error ? error.message : 'Unable to create doubt right now.');
            });
    };

    const handleAddMessageToDoubt = (doubtId: string, message: ChatMessageType) => {
        const updatedDoubts = doubts.map(d => {
            if (d.id === doubtId) {
                // Check if the current user ('You') has already participated in this doubt
                const hasUserParticipated = d.messages.some(m => m.author === 'You');

                const newMessages = [...d.messages, message];
                
                // Increment participant count only if this is the user's first message
                const newParticipantCount = hasUserParticipated ? d.participants : d.participants + 1;

                const updatedDoubt = { 
                    ...d, 
                    messages: newMessages,
                    participants: newParticipantCount,
                };
                
                // If this is the active doubt, update the activeDoubt state as well
                if (activeDoubt && activeDoubt.id === doubtId) {
                    setActiveDoubt(updatedDoubt);
                }
                
                return updatedDoubt;
            }
            return d;
        });
        setDoubts(updatedDoubts);
    };

    const renderContent = () => {
        switch(view) {
            case 'ai-match':
                return (
                    <AiMatchView 
                        onJoinCall={onJoinCall} 
                        onBookSession={onBookSession} 
                        onBrowseAll={() => setView('browse-mentors')} 
                        onNavigateToSessions={handleNavigateToSessions}
                        initialProfile={menteeProfile} 
                        onUpdateMenteeProfile={onUpdateMenteeProfile}
                        initialMatchmakingProfile={matchmakingProfile}
                        onUpdateMatchmakingProfile={onUpdateMatchmakingProfile}
                    />
                );
            case 'browse-mentors':
                return <BrowseMentorsView onJoinCall={onJoinCall} onBookSession={onBookSession} onNavigateToSessions={handleNavigateToSessions} />;
            case 'mentorship-hub':
    return <MentorshipHub sessions={sessions} onJoinSessionCall={onJoinSessionCall} />;
            case 'my-profile':
                return <MenteeProfileView menteeProfile={menteeProfile} onUpdateProfile={onUpdateMenteeProfile} />;
            case 'workshops':
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-3xl font-bold text-slate-100 mb-2">Workshops</h2>
                        <p className="text-lg text-slate-400 mb-8">Discover and join upcoming workshops to enhance your skills.</p>
                        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
                            <p className="text-slate-400">Workshops feature coming soon...</p>
                        </div>
                    </div>
                );
            case 'doubt-room':
                if (activeDoubt) {
                    return <DoubtSessionPage doubt={activeDoubt} onLeave={() => setView('selection')} onSendMessage={handleAddMessageToDoubt} />;
                }
                return (
                    <div className="space-y-4">
                        {doubtsError && (
                            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {doubtsError}
                            </div>
                        )}
                        {doubtsLoading && doubts.length === 0 && (
                            <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-6 text-center text-sm text-slate-400">
                                Loading doubts...
                            </div>
                        )}
                        <DoubtRoomView doubts={doubts} onJoinDoubt={handleJoinDoubt} onCreateDoubt={handleCreateDoubt} />
                    </div>
                );
            case 'selection':
            default:
                return (
                    <div className="flex flex-col xl:flex-row gap-6 animate-fade-in">
                        {/* Main Content */}
                        <div className="flex-1 space-y-6">
                            {/* Welcome Banner */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 sm:p-8 text-white relative overflow-hidden">
                                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {menteeProfile.name || 'User'}!</h1>
                                        <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base">Ready to continue your mentorship journey!</p>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button className="bg-white/20 hover:bg-white/30 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base">
                                                Continue Last Session
                                            </button>
                                            <button 
                                                onClick={loadDashboardData}
                                                disabled={dashboardLoading}
                                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                                            >
                                                {dashboardLoading ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                )}
                                                Refresh
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -translate-y-4 sm:-translate-y-8 translate-x-4 sm:translate-x-8"></div>
                                <div className="absolute bottom-0 right-8 sm:right-16 w-16 sm:w-24 h-16 sm:h-24 bg-white/5 rounded-full translate-y-2 sm:translate-y-4"></div>
                            </div>

                            {/* Error Message */}
                            {dashboardError && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-200">
                                    <p className="text-sm">⚠️ {dashboardError}</p>
                                    <button 
                                        onClick={loadDashboardData}
                                        className="mt-2 text-xs text-red-300 hover:text-red-100 underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-teal-600 rounded-xl p-4 sm:p-6 text-white relative">
                                    {dashboardLoading && (
                                        <div className="absolute inset-0 bg-teal-600/50 rounded-xl flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <ClockIcon />
                                        </div>
                                        <div>
                                            <p className="text-teal-100 text-xs sm:text-sm">Completed Sessions</p>
                                            <p className="text-xl sm:text-2xl font-bold">{sessionStats.completed}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-600 rounded-xl p-4 sm:p-6 text-white relative">
                                    {dashboardLoading && (
                                        <div className="absolute inset-0 bg-slate-600/50 rounded-xl flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <UsersIcon />
                                        </div>
                                        <div>
                                            <p className="text-slate-100 text-xs sm:text-sm">Upcoming Sessions</p>
                                            <p className="text-xl sm:text-2xl font-bold">{sessionStats.upcoming}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-orange-500 rounded-xl p-4 sm:p-6 text-white relative sm:col-span-2 lg:col-span-1">
                                    {dashboardLoading && (
                                        <div className="absolute inset-0 bg-orange-500/50 rounded-xl flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <SparklesIcon />
                                        </div>
                                        <div>
                                            <p className="text-orange-100 text-xs sm:text-sm">Mentee Progress</p>
                                            <p className="text-xl sm:text-2xl font-bold">{sessionStats.progress}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Session Activity Chart */}
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative">
                                {dashboardLoading && (
                                    <div className="absolute inset-0 bg-slate-800/50 rounded-xl flex items-center justify-center z-10">
                                        <div className="w-8 h-8 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-100">Monthly Session Activity</h3>
                                        {dashboardStats && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                Last updated: {new Date(dashboardStats.lastUpdated).toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                            <span className="text-slate-300 text-sm">Completed</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                                            <span className="text-slate-300 text-sm">Upcoming</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-64 bg-slate-700/50 rounded-lg p-4">
                                    {monthlyChartData.length > 0 ? (
                                        <div className="h-full flex items-end justify-between gap-2">
                                            {monthlyChartData.map((monthData, index) => {
                                                const maxSessions = Math.max(...monthlyChartData.map(d => d.completed + d.upcoming), 1);
                                                const completedHeight = (monthData.completed / maxSessions) * 100;
                                                const upcomingHeight = (monthData.upcoming / maxSessions) * 100;
                                                const totalSessions = monthData.completed + monthData.upcoming;
                                                
                                                return (
                                                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                                        <div className="w-full flex flex-col items-center" style={{ height: '200px' }}>
                                                            <div className="w-full flex flex-col justify-end items-center h-full gap-1">
                                                                {/* Upcoming sessions bar */}
                                                                {monthData.upcoming > 0 && (
                                                                    <div 
                                                                        className="w-8 bg-green-500 rounded-t transition-all duration-300 hover:bg-green-400"
                                                                        style={{ height: `${upcomingHeight}%` }}
                                                                        title={`${monthData.upcoming} upcoming sessions`}
                                                                    ></div>
                                                                )}
                                                                {/* Completed sessions bar */}
                                                                {monthData.completed > 0 && (
                                                                    <div 
                                                                        className="w-8 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-400"
                                                                        style={{ height: `${completedHeight}%` }}
                                                                        title={`${monthData.completed} completed sessions`}
                                                                    ></div>
                                                                )}
                                                                {/* Show placeholder if no sessions */}
                                                                {totalSessions === 0 && (
                                                                    <div className="w-8 h-2 bg-slate-600 rounded"></div>
                                                                )}
                                                            </div>
                                                            {/* Session count label */}
                                                            {totalSessions > 0 && (
                                                                <div className="text-xs text-slate-300 font-medium">
                                                                    {totalSessions}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Month label */}
                                                        <div className="text-xs text-slate-400 text-center">
                                                            {monthData.month}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-slate-400 text-sm">No session data available</p>
                                                <p className="text-slate-500 text-xs mt-1">Book sessions to see your activity chart</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="xl:w-80 space-y-6">
                            {/* Favourite Mentors */}
                            <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700 relative">
                                {dashboardLoading && (
                                    <div className="absolute inset-0 bg-slate-800/50 rounded-xl flex items-center justify-center z-10">
                                        <div className="w-6 h-6 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
                                    </div>
                                )}
                                <h3 className="text-lg font-bold text-slate-100 mb-4">Favourite Mentors</h3>
                                <div className="space-y-3">
                                    {favoriteMentors.length > 0 ? (
                                        favoriteMentors.map((mentorData, index) => {
                                            const mentor = mentorData.mentor;
                                            const sessionCount = mentorData.sessionCount;
                                            const isTopMentor = index === 0 && sessionCount > 1;
                                            const initials = mentor.name
                                                .split(' ')
                                                .map(name => name.charAt(0).toUpperCase())
                                                .slice(0, 2)
                                                .join('');
                                            
                                            // Color variations for avatars
                                            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                                            const bgColor = colors[index % colors.length];
                                            
                                            return (
                                                <div 
                                                    key={mentor.name}
                                                    className={`flex items-center gap-3 p-3 rounded-lg ${
                                                        isTopMentor 
                                                            ? 'bg-blue-600/20 border border-blue-500/30' 
                                                            : 'bg-slate-700/50'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bgColor} rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm`}>
                                                        {initials}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-slate-100 font-medium text-sm sm:text-base truncate">{mentor.name}</p>
                                                        <p className={`text-xs sm:text-sm ${isTopMentor ? 'text-blue-300' : 'text-slate-400'}`}>
                                                            {isTopMentor 
                                                                ? `Top Mentor • ${sessionCount} sessions`
                                                                : `${sessionCount} session${sessionCount > 1 ? 's' : ''}`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-6 sm:py-8">
                                            <p className="text-slate-400 text-sm">No session history yet</p>
                                            <p className="text-slate-500 text-xs mt-1">Book sessions to see your favorite mentors here</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upcoming Workshops */}
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-slate-100 mb-4">Upcoming Workshops</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm font-bold">📚</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-100 font-medium">Mastering React.js</p>
                                                <p className="text-slate-400 text-sm">Dec 19, 10:00 AM</p>
                                            </div>
                                        </div>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                                            Register
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm font-bold">🎤</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-100 font-medium">Public Speaking Skills</p>
                                                <p className="text-slate-400 text-sm">Dec 20, 2:00 PM</p>
                                            </div>
                                        </div>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                                            Register
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="animate-fade-in relative">
            {renderContent()}
            <Chatbot />
        </div>
    );
};