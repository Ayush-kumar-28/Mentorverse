import React, { useState, useMemo } from 'react';
import type { Mentor, BookedSession, ChatMessage } from '../types';
import { VideoIcon } from './icons/VideoIcon';
import { ChatHistoryIcon } from './icons/ChatHistoryIcon';
import { ChatHistoryModal } from './ChatHistoryModal';

interface MentorshipHubProps {
    sessions: BookedSession[];
    onJoinSessionCall: (session: BookedSession) => void;
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

const UpcomingSessionCard: React.FC<{ session: BookedSession; onJoinSessionCall: (session: BookedSession) => void; }> = ({ session, onJoinSessionCall }) => {
    const { dateLabel, timeLabel } = formatSessionDateTime(session.scheduledStart);
    return (
         <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between gap-4 border border-slate-700">
            <div className="flex items-center gap-4">
                <img 
                    className="h-12 w-12 rounded-full object-cover" 
                    src={`https://picsum.photos/seed/${session.mentor.name}/200`} 
                    alt={session.mentor.name} 
                />
                <div>
                    <h4 className="font-bold text-gray-100">{session.mentor.name}</h4>
                    <p className="text-sm text-gray-400">{dateLabel} at {timeLabel}</p>
                </div>
            </div>
            <button
                onClick={() => onJoinSessionCall(session)}
                className="inline-flex items-center px-3 py-1.5 bg-green-500/20 text-green-300 text-sm font-semibold rounded-md hover:bg-green-500/30 transition-colors"
            >
                <VideoIcon />
                Join
            </button>
        </div>
    );
}

const PastSessionCard: React.FC<{ 
    session: BookedSession; 
    onViewChat: (chatHistory: ChatMessage[], participantName: string) => void;
}> = ({ session, onViewChat }) => {
    const hasChat = session.chatHistory && session.chatHistory.length > 0;
    const { dateLabel } = formatSessionDateTime(session.scheduledStart);
    
    // Determine status label based on session status and date
    let statusLabel = 'Scheduled for';
    if (session.status === 'cancelled') {
        statusLabel = 'Cancelled on';
    } else if (session.status === 'completed') {
        statusLabel = 'Completed on';
    } else {
        // Session date has passed but status is still 'upcoming'
        const sessionDate = new Date(session.scheduledStart);
        const now = new Date();
        if (sessionDate < now) {
            statusLabel = 'Scheduled for';
        }
    }
    
    return (
        <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between gap-4 border border-slate-700 opacity-70">
            <div className="flex items-center gap-4">
                <img 
                    className="h-12 w-12 rounded-full object-cover filter grayscale" 
                    src={`https://picsum.photos/seed/${session.mentor.name}/200`} 
                    alt={session.mentor.name} 
                />
                <div>
                    <h4 className="font-bold text-slate-300">{session.mentor.name}</h4>
                    <p className="text-sm text-slate-400">{statusLabel} {dateLabel}</p>
                </div>
            </div>
            <button
                onClick={() => onViewChat(session.chatHistory || [], session.mentor.name)}
                disabled={!hasChat}
                className="inline-flex items-center px-3 py-1.5 bg-slate-700 text-slate-300 text-sm font-semibold rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChatHistoryIcon />
                Chat
            </button>
        </div>
    );
};

export const MentorshipHub: React.FC<MentorshipHubProps> = ({ sessions, onJoinSessionCall }) => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
    const [isChatModalOpen, setChatModalOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState<{ history: ChatMessage[], participantName: string } | null>(null);

    const { upcomingSessions, pastSessions } = useMemo(() => {
        const upcoming: BookedSession[] = [];
        const past: BookedSession[] = [];
        const now = new Date();
        
        sessions.forEach(session => {
            const sessionDate = new Date(session.scheduledStart);
            const isDatePassed = sessionDate < now;
            
            // Move to history if date has passed OR if status is completed/cancelled
            if (isDatePassed || session.status === 'completed' || session.status === 'cancelled') {
                past.push(session);
            } else {
                upcoming.push(session);
            }
        });
        
        // Sort past sessions by date (most recent first)
        past.sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());
        
        // Sort upcoming sessions by date (earliest first)
        upcoming.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
        
        return { upcomingSessions: upcoming, pastSessions: past };
    }, [sessions]);
    
    const handleViewChat = (chatHistory: ChatMessage[], participantName: string) => {
        setSelectedChat({ history: chatHistory, participantName });
        setChatModalOpen(true);
    };

    const handleCloseChat = () => {
        setChatModalOpen(false);
        setSelectedChat(null);
    };

    return (
        <>
            <div className="max-w-3xl mx-auto animate-fade-in">
                <h2 className="text-3xl font-bold text-gray-100 mb-2">My Mentorship Hub</h2>
                <p className="text-lg text-gray-400 mb-8">Review your upcoming sessions, and look back at your chat history.</p>
                
                <div className="flex border-b border-slate-700 mb-6">
                    <button 
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'upcoming' ? 'border-b-2 border-brand-primary text-brand-accent' : 'text-slate-400 hover:text-white'}`}
                    >
                        Upcoming Sessions
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'history' ? 'border-b-2 border-brand-primary text-brand-accent' : 'text-slate-400 hover:text-white'}`}
                    >
                        Session History
                    </button>
                </div>

                <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 min-h-[200px]">
                    {activeTab === 'upcoming' && (
                        <div className="animate-fade-in">
                            {upcomingSessions.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingSessions.map((session, index) => (
                                        <UpcomingSessionCard key={`upcoming-${index}`} session={session} onJoinSessionCall={onJoinSessionCall} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">You have no upcoming sessions. Find a mentor to get started!</p>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'history' && (
                         <div className="animate-fade-in">
                            {pastSessions.length > 0 ? (
                                <div className="space-y-4">
                                    {pastSessions.map((session, index) => (
                                       <PastSessionCard key={`past-${index}`} session={session} onViewChat={handleViewChat} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">You have no past sessions yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {selectedChat && (
                <ChatHistoryModal 
                    isOpen={isChatModalOpen}
                    onClose={handleCloseChat}
                    chatHistory={selectedChat.history}
                    participantName={selectedChat.participantName}
                />
            )}
        </>
    );
};