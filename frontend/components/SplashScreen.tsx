import React from 'react';
import { Logo } from './icons/Logo';

interface SplashScreenProps {
  isExiting: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isExiting }) => {
  return (
    <div className={`fixed inset-0 bg-space-dark flex flex-col items-center justify-center z-50 transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Animated background container */}
      <div className="absolute inset-0 stars-bg"></div>

      {/* Content container */}
      <div className="relative text-center z-10 animate-fade-in p-4">
        <div className="inline-block p-4 rounded-full bg-slate-800/50 animate-subtle-pulse">
            <Logo className="h-24 w-24 text-brand-accent" />
        </div>
        
        <h1 
          className="mt-8 text-4xl sm:text-5xl font-extrabold text-white animate-slide-in-up"
          style={{ animationDelay: '200ms' }}
        >
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-violet-400">MentorVerse</span>
        </h1>
        
        <p 
          className="mt-4 text-lg sm:text-xl text-slate-300 animate-slide-in-up"
          style={{ animationDelay: '400ms' }}
        >
          Connecting Ambition with Wisdom.
        </p>

        <div 
          className="mt-12 text-slate-400 animate-fade-in"
          style={{ animationDelay: '800ms' }}
        >
          <p>Finding your path...</p>
          <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto mt-2 overflow-hidden">
            <div className="w-full h-full bg-brand-primary animate-loading-bar"></div>
          </div>
        </div>

      </div>
    </div>
  );
};