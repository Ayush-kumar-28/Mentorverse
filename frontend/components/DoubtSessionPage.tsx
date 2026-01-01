import React, { useState, useRef, useEffect } from 'react';
import type { Doubt, ChatMessage } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { SendIcon } from './icons/SendIcon';

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-3 my-4 ${isUser ? 'flex-row-reverse' : ''}`}>
             <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-600 text-slate-200 text-xs font-bold">
               {message.author?.substring(0, 2) || 'AN'}
            </div>
            <div className={`px-4 py-3 rounded-xl max-w-lg break-words ${isUser ? 'bg-brand-primary text-white' : 'bg-slate-700 text-gray-200'}`}>
                {!isUser && <p className="text-xs font-bold text-brand-accent mb-1">{message.author}</p>}
                <p className="text-sm">{message.text}</p>
            </div>
        </div>
    );
}

interface DoubtSessionPageProps {
    doubt: Doubt;
    onLeave: () => void;
    onSendMessage: (doubtId: string, message: ChatMessage) => void;
}

export const DoubtSessionPage: React.FC<DoubtSessionPageProps> = ({ doubt, onLeave, onSendMessage }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [doubt.messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: ChatMessage = {
            role: 'user',
            text: input,
            author: 'You',
        };
        onSendMessage(doubt.id, userMessage);
        setInput('');
    };
    
    return (
        <div className="h-[calc(100vh-200px)] flex flex-col bg-slate-800 rounded-xl shadow-2xl border border-slate-700 animate-fade-in">
            <div className="flex items-center p-4 border-b border-slate-700">
                <button onClick={onLeave} className="mr-4 text-slate-400 hover:text-brand-accent transition-colors">
                    <ArrowLeftIcon />
                </button>
                <div className="flex-grow">
                    <h2 className="font-bold text-lg text-slate-100 truncate">{doubt.title}</h2>
                    <p className="text-sm text-slate-400 truncate">A discussion with {doubt.participants} mentees</p>
                </div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto bg-slate-900">
                {doubt.imageUrl && (
                    <div className="mb-4">
                        <img
                            src={doubt.imageUrl}
                            alt="Doubt reference"
                            className="w-full max-h-72 object-cover rounded-xl border border-slate-700/70"
                        />
                    </div>
                )}
                {doubt.messages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700 flex items-center gap-2 bg-slate-800 rounded-b-xl">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent sm:text-sm transition-all"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2.5 rounded-md text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-label="Send message"
                >
                    <SendIcon />
                </button>
            </form>
        </div>
    );
};
