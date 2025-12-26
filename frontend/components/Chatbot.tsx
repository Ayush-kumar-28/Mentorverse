import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import { apiService } from '../services/api';
import { ChatMessage } from './ChatMessage';
import { SendIcon } from './icons/SendIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';


export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessageType[]>([
        { role: 'model', text: "Hi! I'm MentorVerse AI. If a mentor isn't available, I can still help and share useful video resources." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<ChatMessageType[]>(messages);
    const pendingSupportPrompt = useRef<string | null>(null);
    const isLoadingRef = useRef(isLoading);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        messagesRef.current = messages;
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmedText = text.trim();
        if (!trimmedText) return;

        const userMessage: ChatMessageType = { role: 'user', text: trimmedText };
        const historyForRequest = [...messagesRef.current, userMessage].map(({ role, text }) => ({ role, text }));

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await apiService.sendChatbotMessage(historyForRequest);
            const reply = response.reply?.trim();
            const content = reply && reply.length > 0
                ? reply
                : "Here's some guidance to get you started. Let me know if you can share more details.";
            setMessages(prev => [...prev, { role: 'model', text: content }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't get a response. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        isLoadingRef.current = isLoading;
        if (!isLoading && pendingSupportPrompt.current) {
            const prompt = pendingSupportPrompt.current;
            pendingSupportPrompt.current = null;
            void sendMessage(prompt);
        }
    }, [isLoading, sendMessage]);

    useEffect(() => {
        const handleSupportRequest = (event: Event) => {
            const { prompt } = (event as CustomEvent<{ prompt?: string }>).detail || {};
            const trimmedPrompt = prompt?.trim();
            if (!trimmedPrompt) return;

            setIsOpen(true);
            if (isLoadingRef.current) {
                pendingSupportPrompt.current = trimmedPrompt;
            } else {
                void sendMessage(trimmedPrompt);
            }
        };

        window.addEventListener('mentorverse:chatbot-support', handleSupportRequest as EventListener);
        return () => {
            window.removeEventListener('mentorverse:chatbot-support', handleSupportRequest as EventListener);
        };
    }, [sendMessage]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        setInput('');
        void sendMessage(trimmedInput);
    };

    return (
        <>
            <div
                className={`fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-full sm:max-w-sm flex flex-col bg-slate-800 rounded-xl shadow-2xl border border-slate-700 transform transition-all duration-300 ease-in-out origin-bottom-right ${
                    isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'
                }`}
                style={{ height: 'min(600px, calc(100vh - 96px))' }}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-t-xl">
                    <h3 className="text-lg font-semibold">
                        Mentorship Assistant
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white" aria-label="Close chat">
                        <CloseIcon />
                    </button>
                </div>
                <div className="flex-grow p-4 overflow-y-auto bg-slate-900">
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} role={msg.role} text={msg.text} />
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 my-4 animate-fade-in">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-light text-brand-primary flex items-center justify-center animate-pulse">
                                <SparklesIcon />
                            </div>
                            <div className="px-4 py-3 rounded-xl bg-slate-700">
                                <p className="text-sm text-slate-400 animate-pulse">Thinking...</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700 flex items-center gap-2 bg-slate-800 rounded-b-xl">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask for advice..."
                        className="flex-grow px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent sm:text-sm transition-all"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-2.5 rounded-md text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </button>
                </form>
            </div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/50 ${!isOpen ? 'animate-subtle-pulse' : ''}`}
                aria-label={isOpen ? "Close chat" : "Open chat"}
            >
                <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 scale-75' : 'rotate-0'}`}>
                    {isOpen ? <CloseIcon /> : <ChatIcon />}
                </div>
            </button>
        </>
    );
};