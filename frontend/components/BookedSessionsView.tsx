import React, { useState, useMemo } from 'react';
import type { Mentor, BookedSession, ChatMessage } from '../types';
import { VideoIcon } from './icons/VideoIcon';
import { ChatHistoryIcon } from './icons/ChatHistoryIcon';

interface BookedSessionsViewProps {
    onJoinCall: (session: BookedSession) => void;
    sessions: BookedSession[];
    onViewChat: (chatHistory: ChatMessage[], participantName: string) => void;
}

const formatSessionDateTime = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return { dateLabel: iso, timeLabel: '' };
    }
    return {
        dateLabel: date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }),
        timeLabel: date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        }),
    };
};

const SessionCard: React.FC<{
    session: BookedSession;
    onJoinCall: (mentee: Mentor) => void;
    onViewChat: (chatHistory: ChatMessage[], participantName: string) => void;
}> = ({ session, onJoinCall, onViewChat }) => {
    const [linkCopied, setLinkCopied] = React.useState(false);
    const now = new Date();
    const sessionDate = new Date(session.scheduledStart);
    const isPastDate = sessionDate < now;
    const isPastStatus = session.status === 'completed' || session.status === 'cancelled';
    const isUpcoming = !isPastDate && !isPastStatus;
    const isPast = isPastDate || isPastStatus;
    
    const hasChat = session.chatHistory && session.chatHistory.length > 0;
    const { dateLabel, timeLabel } = formatSessionDateTime(session.scheduledStart);
    const reasonPreview = session.mentee.matchReasoning || session.reason || '';
    
    // Determine session status display
    const getStatusInfo = () => {
        if (session.status === 'completed') {
            return { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/20' };
        } else if (session.status === 'cancelled') {
            return { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/20' };
        } else if (isPastDate) {
            return { label: 'Missed', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
        } else {
            return { label: 'Upcoming', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
        }
    };
    
    const statusInfo = getStatusInfo();
    
    const copyMeetingLink = () => {
        if (session.meetingLink) {
            navigator.clipboard.writeText(session.meetingLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    return (
        <div className={`bg-slate-800 rounded-xl shadow-md border border-slate-700 p-4 sm:p-6 flex flex-col gap-4 transition-all hover:shadow-lg ${isPast ? 'opacity-90' : ''}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <img
                        className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ${isPast ? 'filter grayscale' : ''}`}
                        src={`https://picsum.photos/seed/${session.mentee.name}/200`}
                        alt={session.mentee.name}
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-bold text-slate-100 truncate">{session.mentee.name}</h4>
                        <p className="text-sm text-slate-300 truncate">{session.mentee.title}</p>
                        {reasonPreview && (
                            <p className="text-xs sm:text-sm text-slate-400 mt-1 italic overflow-hidden" style={{ 
                                display: '-webkit-box', 
                                WebkitLineClamp: 2, 
                                WebkitBoxOrient: 'vertical' 
                            }}>
                                "{reasonPreview}"
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {statusInfo.label}
                    </div>
                    <p className={`text-sm font-semibold ${isUpcoming ? 'text-brand-accent' : 'text-slate-400'}`}>{dateLabel}</p>
                    <p className="text-sm text-slate-400">{timeLabel}</p>
                </div>
            </div>
            
            {/* Meeting Link Section - Only show for upcoming sessions */}
            {isUpcoming && session.meetingLink && (
                <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                    <p className="text-xs text-slate-400 mb-2">Meeting Link (Share with mentee):</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={session.meetingLink}
                            readOnly
                            className="flex-1 bg-slate-800 text-slate-300 px-3 py-2 rounded text-sm border border-slate-600 focus:outline-none"
                        />
                        <button
                            onClick={copyMeetingLink}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                            title="Copy meeting link"
                        >
                            {linkCopied ? '✓ Copied' : '📋 Copy'}
                        </button>
                    </div>
                </div>
            )}
            
            {/* Session Details for Past Sessions */}
            {isPast && (
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-slate-400">Duration:</span>
                            <span className="text-slate-300 ml-2">{session.durationMinutes || 30} minutes</span>
                        </div>
                        {session.status === 'completed' && (
                            <div>
                                <span className="text-slate-400">Session completed</span>
                                <span className="text-green-400 ml-2">✓</span>
                            </div>
                        )}
                        {hasChat && (
                            <div className="sm:col-span-2">
                                <span className="text-slate-400">Chat messages:</span>
                                <span className="text-slate-300 ml-2">{session.chatHistory?.length || 0} messages</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
                {isUpcoming ? (
                    <button
                        onClick={() => onJoinCall(session)}
                        className="flex-1 inline-flex justify-center items-center px-4 sm:px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        <VideoIcon />
                        Join Video Call
                    </button>
                ) : (
                    <>
                        {hasChat ? (
                            <button
                                onClick={() => onViewChat(session.chatHistory || [], session.mentee.name)}
                                className="flex-1 inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <ChatHistoryIcon />
                                View Chat History
                            </button>
                        ) : (
                            <div className="flex-1 inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-slate-700 text-slate-400 font-semibold rounded-lg cursor-not-allowed">
                                <ChatHistoryIcon />
                                No Chat History
                            </div>
                        )}
                        {session.meetingLink && (
                            <button
                                onClick={copyMeetingLink}
                                className="px-4 py-3 bg-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-500 transition-colors text-sm"
                                title="Copy meeting link"
                            >
                                {linkCopied ? '✓ Link Copied' : '📋 Copy Link'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};


export const BookedSessionsView: React.FC<BookedSessionsViewProps> = ({ onJoinCall, sessions, onViewChat }) => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

    const { upcomingSessions, pastSessions } = useMemo(() => {
        const now = new Date();
        const upcoming: BookedSession[] = [];
        const past: BookedSession[] = [];
        
        sessions.forEach(session => {
            const sessionDate = new Date(session.scheduledStart);
            const isPastDate = sessionDate < now;
            const isPastStatus = session.status === 'completed' || session.status === 'cancelled';
            
            // A session is considered past if:
            // 1. It has a past status (completed/cancelled), OR
            // 2. The scheduled date has passed (regardless of status)
            if (isPastStatus || isPastDate) {
                past.push(session);
            } else {
                upcoming.push(session);
            }
        });
        
        // Sort upcoming sessions by date (earliest first)
        upcoming.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
        
        // Sort past sessions by date (most recent first)
        past.sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());
        
        return { upcomingSessions: upcoming, pastSessions: past };
    }, [sessions]);

    const sessionsToShow = activeTab === 'upcoming' ? upcomingSessions : pastSessions;
    const hasSessions = sessionsToShow.length > 0;
    const noSessionsMessage = activeTab === 'upcoming' 
        ? "When mentees book sessions with you, they will appear here. You can join video calls and share meeting links." 
        : "Your completed, cancelled, and missed sessions will appear here. You can review chat history and session details.";
    const noSessionsTitle = activeTab === 'upcoming' ? 'No Upcoming Sessions' : 'No Session History';
    const noSessionsIcon = activeTab === 'upcoming' 
        ? (
            <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
        : (
            <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );

    if (sessions.length === 0) {
        return (
            <div className="text-center p-12 bg-slate-800 rounded-lg shadow-lg border border-slate-700 animate-fade-in">
                <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-xl font-semibold text-slate-100">No Sessions Booked</h3>
                <p className="mt-1 text-sm text-slate-400">Your booked sessions with mentees will appear here.</p>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-100 mb-2">My Sessions</h2>
            <p className="text-lg text-slate-400 mb-8">Manage your upcoming sessions and review past conversations.</p>

            <div className="flex border-b border-slate-700 mb-6">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'upcoming' ? 'border-b-2 border-brand-primary text-brand-accent' : 'text-slate-400 hover:text-white'}`}
                >
                    Upcoming
                    {upcomingSessions.length > 0 && (
                        <span className="bg-brand-primary text-white text-xs px-2 py-1 rounded-full">
                            {upcomingSessions.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-b-2 border-brand-primary text-brand-accent' : 'text-slate-400 hover:text-white'}`}
                >
                    History
                    {pastSessions.length > 0 && (
                        <span className="bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded-full">
                            {pastSessions.length}
                        </span>
                    )}
                </button>
            </div>

            {hasSessions ? (
                <div className="space-y-4 animate-fade-in">
                    {sessionsToShow.map((session, index) => (
                        <SessionCard key={`${session.id}-${index}`} session={session} onJoinCall={onJoinCall} onViewChat={onViewChat} />
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 sm:p-12 bg-slate-800 rounded-lg shadow-inner border border-slate-700/50 animate-fade-in">
                    {noSessionsIcon}
                    <h3 className="mt-4 text-lg sm:text-xl font-semibold text-slate-300">{noSessionsTitle}</h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">{noSessionsMessage}</p>
                </div>
            )}
        </div>
    );
};