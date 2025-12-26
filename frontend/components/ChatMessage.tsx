import React from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { MenteeIcon } from './icons/MenteeIcon';

export const ChatMessage: React.FC<ChatMessageType> = ({ role, text }) => {
    const isModel = role === 'model';

    return (
        <div className={`flex items-start gap-3 my-4 ${isModel ? '' : 'flex-row-reverse'}`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isModel ? 'bg-brand-light text-brand-accent' : 'bg-slate-600 text-slate-200'}`}>
                {isModel ? <SparklesIcon /> : <MenteeIcon />}
            </div>
            <div className={`px-4 py-3 rounded-xl max-w-sm break-words ${isModel ? 'bg-slate-700 text-gray-200' : 'bg-brand-primary text-white'}`}>
                <p className="text-sm">{text}</p>
            </div>
        </div>
    );
};