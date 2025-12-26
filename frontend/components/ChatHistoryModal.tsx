import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { ChatMessage } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  participantName: string;
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const author = isUser ? 'You' : message.author;
    
    return (
        <div className={`flex items-start gap-3 my-4 ${isUser ? 'flex-row-reverse' : ''}`}>
             <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-600 text-slate-200 text-xs font-bold">
               {author?.substring(0, 2) || 'AN'}
            </div>
            <div className={`px-4 py-3 rounded-xl max-w-lg break-words ${isUser ? 'bg-brand-primary text-white' : 'bg-slate-700 text-gray-200'}`}>
                {!isUser && <p className="text-xs font-bold text-brand-accent mb-1">{author}</p>}
                <p className="text-sm">{message.text}</p>
            </div>
        </div>
    );
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ isOpen, onClose, chatHistory, participantName }) => {
    
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center animate-fade-in p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg h-[70vh] transform transition-all animate-slide-in-up flex flex-col text-gray-200 border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-lg font-bold">Chat History with {participantName}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="flex-grow p-4 overflow-y-auto bg-slate-900">
                    {chatHistory.length > 0 ? (
                        chatHistory.map((msg, index) => <ChatBubble key={index} message={msg} />)
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <p>No chat history available for this session.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};