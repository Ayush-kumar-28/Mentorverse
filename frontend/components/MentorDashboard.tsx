import React, { useState } from 'react';
import { BookedSessionsView } from './BookedSessionsView';
import { MentorProfileView } from './MentorProfileView';
import { MentorEditProfileView } from './MentorEditProfileView';
import type { Mentor, BookedSession, MentorDashboardView, ChatMessage } from '../types';
import { ChatHistoryModal } from './ChatHistoryModal';
import { allMentors } from '../data/mentors';

interface MentorDashboardProps {
    view: MentorDashboardView;
    setView: (view: MentorDashboardView) => void;
    onJoinSessionCall: (session: BookedSession) => void;
    sessions: BookedSession[];
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ view, setView, onJoinSessionCall, sessions }) => {
    // State for the logged-in mentor's profile. Using the first mentor as an example.
    const [mentorProfile, setMentorProfile] = useState<Mentor>(allMentors[0]);
    
    const [isChatModalOpen, setChatModalOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState<{ history: ChatMessage[], participantName: string } | null>(null);

    const handleViewChat = (chatHistory: ChatMessage[], participantName: string) => {
        setSelectedChat({ history: chatHistory, participantName });
        setChatModalOpen(true);
    };

    const handleCloseChat = () => {
        setChatModalOpen(false);
        setSelectedChat(null);
    };

    const handleUpdateProfile = (updatedMentor: Mentor) => {
        setMentorProfile(updatedMentor);
        // After saving, go back to the profile view
        setView('profile');
    };

    const renderContent = () => {
        switch (view) {
            case 'sessions':
                return <BookedSessionsView onJoinCall={onJoinSessionCall} sessions={sessions} onViewChat={handleViewChat} />;
            case 'profile':
                return <MentorProfileView mentor={mentorProfile} onEditProfile={() => setView('edit-profile')} />;
            case 'edit-profile':
                return <MentorEditProfileView mentor={mentorProfile} onSave={handleUpdateProfile} onCancel={() => setView('profile')} />;
            default:
                return <BookedSessionsView onJoinCall={onJoinSessionCall} sessions={sessions} onViewChat={handleViewChat} />;
        }
    };

    return (
        <>
            <div className="animate-fade-in">
                {renderContent()}
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