import React, { useState } from 'react';
import type { Mentor, BookSessionHandler } from '../types';
import { BookingModal } from './BookingModal';
import { BookIcon } from './icons/BookIcon';

interface MentorCardProps {
  mentor: Mentor;
  index: number;
  onJoinCall: (mentor: Mentor) => void;
  onBookSession: BookSessionHandler;
  onNavigateToSessions?: () => void;
  isNew?: boolean;
}

export const MentorCard: React.FC<MentorCardProps> = ({ mentor, index, onJoinCall, onBookSession, onNavigateToSessions, isNew = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div 
        className={`bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border ${isNew ? 'border-green-500/50' : 'border-slate-700'} overflow-hidden transform hover:-translate-y-1.5 transition-all duration-300 animate-slide-in-up flex flex-col group hover:shadow-2xl relative`}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {isNew && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs font-medium shadow-lg">
              NEW
            </span>
          </div>
        )}
        <div className="p-6 pb-4 flex-grow">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 rounded-full ring-4 ring-slate-800/80 shadow-md overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {mentor.avatar ? (
                <img 
                  className="h-full w-full object-cover" 
                  src={mentor.avatar} 
                  alt={mentor.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling!.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`text-white font-bold text-lg ${mentor.avatar ? 'hidden' : ''}`}>
                {mentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-100">{mentor.name}</h3>
              <p className="text-sm text-brand-accent font-semibold">{mentor.title}</p>
              <p className="text-sm text-slate-400">{mentor.company}</p>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expertise</p>
            <div className="flex flex-wrap gap-2">
              {mentor.expertise.map((skill, i) => (
                <span key={i} className="px-3 py-1 text-xs font-medium text-indigo-200 bg-brand-light/50 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          {mentor.matchReasoning && (
            <div className="mt-4 pt-4 border-t border-slate-700/80">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Why it's a match</p>
              <p className="text-sm text-slate-300 italic">"{mentor.matchReasoning}"</p>
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-900/50">
          <button 
            onClick={openModal}
            className="w-full flex items-center justify-center gap-2 text-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-dark hover:to-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-300 transform group-hover:scale-105">
              <BookIcon />
              Book a Session
          </button>
        </div>
      </div>
      <BookingModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        mentor={mentor}
        onJoinCall={onJoinCall}
        onBookSession={onBookSession}
        onNavigateToSessions={onNavigateToSessions}
      />
    </>
  );
};

export const MentorCardSkeleton: React.FC = () => {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 overflow-hidden p-6">
            <div className="animate-pulse">
                <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-slate-700 h-16 w-16 flex-shrink-0"></div>
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                        <div className="h-3 bg-slate-700 rounded w-2/5"></div>
                    </div>
                </div>
                <div className="mt-5 space-y-2">
                    <div className="h-3 bg-slate-700 rounded w-20"></div>
                    <div className="flex flex-wrap gap-2">
                        <div className="h-6 bg-slate-700 rounded-full w-16"></div>
                        <div className="h-6 bg-slate-700 rounded-full w-20"></div>
                        <div className="h-6 bg-slate-700 rounded-full w-14"></div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/80 space-y-2">
                    <div className="h-3 bg-slate-700 rounded w-24"></div>
                    <div className="h-3 bg-slate-700 rounded w-full"></div>
                    <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                </div>
                <div className="mt-6 h-10 bg-slate-700 rounded-lg w-full"></div>
            </div>
        </div>
    );
};