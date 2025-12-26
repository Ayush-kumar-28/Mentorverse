import React from 'react';
import type { Mentor, BookSessionHandler } from '../types';
import { MentorCard, MentorCardSkeleton } from './MentorCard';

interface MentorRecommendationsProps {
  mentors: Mentor[];
  isLoading: boolean;
  error: string | null;
  onJoinCall: (mentor: Mentor) => void;
  onBookSession: BookSessionHandler;
  onNavigateToSessions?: () => void;
  onBrowseAll: () => void;
}

export const MentorRecommendations: React.FC<MentorRecommendationsProps> = ({ mentors, isLoading, error, onJoinCall, onBookSession, onNavigateToSessions, onBrowseAll }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-100 mb-2">Finding your perfect match...</h2>
        <p className="text-gray-400">Our AI is analyzing your profile to find the best mentors.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {[...Array(4)].map((_, index) => <MentorCardSkeleton key={index} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-slate-800 rounded-lg shadow border border-red-500/30">
        <h3 className="text-xl font-semibold text-red-400">An Error Occurred</h3>
        <p className="text-red-400 mt-2">{error}</p>
      </div>
    );
  }

  if (mentors.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-800 rounded-lg shadow-lg border border-slate-700 animate-fade-in">
        <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-xl font-semibold text-gray-100">Ready to find your mentor?</h3>
        <p className="mt-1 text-sm text-gray-400">Fill out your profile on the left to get started.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold text-gray-100 mb-4">Your Top Mentor Matches</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mentors.map((mentor, index) => (
          <MentorCard key={index} mentor={mentor} index={index} onJoinCall={onJoinCall} onBookSession={onBookSession} onNavigateToSessions={onNavigateToSessions} />
        ))}
      </div>
       {!isLoading && mentors.length > 0 && mentors.length < 4 && (
        <div className="mt-8 text-center bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700 animate-fade-in">
            <p className="text-gray-300 font-medium mb-3">Looking for more options?</p>
            <button
                onClick={onBrowseAll}
                className="px-6 py-2 font-semibold rounded-lg shadow-sm text-brand-accent bg-brand-light/50 hover:bg-brand-light transition-all duration-300"
            >
                Browse All Mentors
            </button>
        </div>
      )}
    </div>
  );
};