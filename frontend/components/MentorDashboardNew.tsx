import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { MentorProfile, BookedSession, MentorDashboardView } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ClockIcon } from './icons/ClockIcon';
import { Chatbot } from './Chatbot';
import { MentorProfileView } from './MentorProfileView';
import { MentorProfileEdit } from './MentorProfileEdit';
import { BookedSessionsView } from './BookedSessionsView';

interface MentorDashboardNewProps {
    view: MentorDashboardView;
    setView: (view: MentorDashboardView) => void;
    onJoinSessionCall: (session: BookedSession) => void;
    sessions: BookedSession[];
    mentorProfile: MentorProfile;
    onUpdateMentorProfile: (profile: Partial<MentorProfile>) => Promise<MentorProfile>;
}

export const MentorDashboardNew: React.FC<MentorDashboardNewProps> = ({ 
    view, 
    setView, 
    onJoinSessionCall, 
    sessions, 
    mentorProfile, 
    onUpdateMentorProfile 
}) => {
    // Calculate session statistics
    const sessionStats = useMemo(() => {
        const now = new Date();
        let sessionHistoryCount = 0; // All past sessions (session history)
        let upcomingCount = 0;
        let actuallyCompletedCount = 0; // Only sessions marked as completed
        
        sessions.forEach(session => {
            const sessionDate = new Date(session.scheduledStart);
            const isPastSession = sessionDate < now || session.status === 'completed' || session.status === 'cancelled';
            
            if (isPastSession) {
                sessionHistoryCount++;
                if (session.status === 'completed') {
                    actuallyCompletedCount++;
                }
            } else {
                upcomingCount++;
            }
        });
        
        const progressPercentage = sessionHistoryCount > 0 ? Math.round((actuallyCompletedCount / sessionHistoryCount) * 100) : 0;
        
        return {
            completed: sessionHistoryCount,
            upcoming: upcomingCount,
            progress: progressPercentage
        };
    }, [sessions]);

    // Generate recent mentees from session history
    const recentMentees = useMemo(() => {
        const menteeSessionCount = new Map<string, { mentee: any; sessionCount: number; lastSession: Date }>();
        const now = new Date();
        
        sessions.forEach(session => {
            const sessionDate = new Date(session.scheduledStart);
            const isPastSession = sessionDate < now || session.status === 'completed' || session.status === 'cancelled';
            
            if (isPastSession) {
                const menteeName = session.mentee.name;
                const existing = menteeSessionCount.get(menteeName);
                
                if (existing) {
                    existing.sessionCount++;
                    if (sessionDate > existing.lastSession) {
                        existing.lastSession = sessionDate;
                    }
                } else {
                    menteeSessionCount.set(menteeName, {
                        mentee: session.mentee,
                        sessionCount: 1,
                        lastSession: sessionDate
                    });
                }
            }
        });
        
        return Array.from(menteeSessionCount.values())
            .sort((a, b) => {
                if (b.sessionCount !== a.sessionCount) {
                    return b.sessionCount - a.sessionCount;
                }
                return b.lastSession.getTime() - a.lastSession.getTime();
            })
            .slice(0, 4);
    }, [sessions]);

    // Generate monthly chart data
    const monthlyChartData = useMemo(() => {
        const monthlyData = new Map<string, { completed: number; upcoming: number; month: string; year: number }>();
        const now = new Date();
        
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
    }, [sessions]);

    const renderContent = () => {
        switch(view) {
            case 'sessions':
                return <BookedSessionsView onJoinCall={onJoinSessionCall} sessions={sessions} onViewChat={() => {}} />;
            case 'profile':
                return <MentorProfileView mentor={mentorProfile} onEditProfile={() => setView('edit-profile')} onUpdateProfile={onUpdateMentorProfile} />;
            case 'edit-profile':
                return (
                    <MentorProfileEdit
                        profile={mentorProfile}
                        onSave={async (updatedProfile) => {
                            await onUpdateMentorProfile(updatedProfile);
                            setView('profile');
                        }}
                        onCancel={() => setView('profile')}
                    />
                );
            case 'selection':
            default:
                return (
                    <div className="flex flex-col xl:flex-row gap-6 animate-fade-in">
                        {/* Main Content */}
                        <div className="flex-1 space-y-6">
                            {/* Welcome Banner */}
                            <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-6 sm:p-8 text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {mentorProfile.name || 'Mentor'}!</h1>
                                    <p className="text-green-100 mb-4 sm:mb-6 text-sm sm:text-base">Ready to inspire and guide the next generation!</p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button 
                                            onClick={() => setView('sessions')}
                                            className="bg-white/20 hover:bg-white/30 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
                                        >
                                            View Sessions
                                        </button>
                                        <button 
                                            onClick={() => setView('profile')}
                                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -translate-y-4 sm:-translate-y-8 translate-x-4 sm:translate-x-8"></div>
                                <div className="absolute bottom-0 right-8 sm:right-16 w-16 sm:w-24 h-16 sm:h-24 bg-white/5 rounded-full translate-y-2 sm:translate-y-4"></div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-blue-600 rounded-xl p-4 sm:p-6 text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <ClockIcon />
                                        </div>
                                        <div>
                                            <p className="text-blue-100 text-xs sm:text-sm">Sessions Conducted</p>
                                            <p className="text-xl sm:text-2xl font-bold">{sessionStats.completed}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-600 rounded-xl p-4 sm:p-6 text-white">
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
                                
                                <div className="bg-purple-500 rounded-xl p-4 sm:p-6 text-white sm:col-span-2 lg:col-span-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <SparklesIcon />
                                        </div>
                                        <div>
                                            <p className="text-purple-100 text-xs sm:text-sm">Success Rate</p>
                                            <p className="text-xl sm:text-2xl font-bold">{sessionStats.progress}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Session Activity Chart */}
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-100">Monthly Mentoring Activity</h3>
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
                                                                {monthData.upcoming > 0 && (
                                                                    <div 
                                                                        className="w-8 bg-green-500 rounded-t transition-all duration-300 hover:bg-green-400"
                                                                        style={{ height: `${upcomingHeight}%` }}
                                                                        title={`${monthData.upcoming} upcoming sessions`}
                                                                    ></div>
                                                                )}
                                                                {monthData.completed > 0 && (
                                                                    <div 
                                                                        className="w-8 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-400"
                                                                        style={{ height: `${completedHeight}%` }}
                                                                        title={`${monthData.completed} completed sessions`}
                                                                    ></div>
                                                                )}
                                                                {totalSessions === 0 && (
                                                                    <div className="w-8 h-2 bg-slate-600 rounded"></div>
                                                                )}
                                                            </div>
                                                            {totalSessions > 0 && (
                                                                <div className="text-xs text-slate-300 font-medium">
                                                                    {totalSessions}
                                                                </div>
                                                            )}
                                                        </div>
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
                                                <p className="text-slate-500 text-xs mt-1">Start mentoring to see your activity chart</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="xl:w-80 space-y-6">
                            {/* Recent Mentees */}
                            <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-slate-100 mb-4">Recent Mentees</h3>
                                <div className="space-y-3">
                                    {recentMentees.length > 0 ? (
                                        recentMentees.map((menteeData, index) => {
                                            const mentee = menteeData.mentee;
                                            const sessionCount = menteeData.sessionCount;
                                            const isTopMentee = index === 0 && sessionCount > 1;
                                            const initials = mentee.name
                                                .split(' ')
                                                .map((name: string) => name.charAt(0).toUpperCase())
                                                .slice(0, 2)
                                                .join('');
                                            
                                            const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
                                            const bgColor = colors[index % colors.length];
                                            
                                            return (
                                                <div 
                                                    key={mentee.name}
                                                    className={`flex items-center gap-3 p-3 rounded-lg ${
                                                        isTopMentee 
                                                            ? 'bg-green-600/20 border border-green-500/30' 
                                                            : 'bg-slate-700/50'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bgColor} rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm`}>
                                                        {initials}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-slate-100 font-medium text-sm sm:text-base truncate">{mentee.name}</p>
                                                        <p className={`text-xs sm:text-sm ${isTopMentee ? 'text-green-300' : 'text-slate-400'}`}>
                                                            {isTopMentee 
                                                                ? `Top Mentee • ${sessionCount} sessions`
                                                                : `${sessionCount} session${sessionCount > 1 ? 's' : ''}`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-6 sm:py-8">
                                            <p className="text-slate-400 text-sm">No mentees yet</p>
                                            <p className="text-slate-500 text-xs mt-1">Start mentoring to see your mentees here</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expertise Areas */}
                            <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-slate-100 mb-4">Your Expertise</h3>
                                <div className="space-y-3">
                                    {mentorProfile.expertise && mentorProfile.expertise.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {mentorProfile.expertise.slice(0, 6).map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 sm:px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs sm:text-sm"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {mentorProfile.expertise.length > 6 && (
                                                <span className="px-2 sm:px-3 py-1 bg-slate-600/50 text-slate-400 rounded-full text-xs sm:text-sm">
                                                    +{mentorProfile.expertise.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-slate-400 text-sm">No expertise areas added</p>
                                            <button 
                                                onClick={() => setView('profile')}
                                                className="text-blue-400 hover:text-blue-300 text-xs mt-1"
                                            >
                                                Update your profile
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
                                <h3 className="text-lg font-bold text-slate-100 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => setView('sessions')}
                                        className="w-full flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left"
                                    >
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <ClockIcon />
                                        </div>
                                        <div>
                                            <p className="text-slate-100 font-medium text-xs sm:text-sm">Manage Sessions</p>
                                            <p className="text-slate-400 text-xs">View and join sessions</p>
                                        </div>
                                    </button>
                                    
                                    <button 
                                        onClick={() => setView('profile')}
                                        className="w-full flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left"
                                    >
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-slate-100 font-medium text-xs sm:text-sm">Update Profile</p>
                                            <p className="text-slate-400 text-xs">Edit your information</p>
                                        </div>
                                    </button>
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