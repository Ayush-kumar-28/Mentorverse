
import React from 'react';
import { MenteeIcon } from './icons/MenteeIcon';
import { MentorIcon } from './icons/MentorIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface HomePageProps {
  onSelectRole: (role: 'mentor' | 'mentee') => void;
}

const RoleButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="group p-6 bg-slate-500/10 rounded-xl shadow-lg border border-slate-700 text-center transform hover:-translate-y-1 transition-all duration-300 flex flex-col items-center hover:shadow-2xl hover:bg-slate-500/20 hover:border-brand-accent/50"
  >
    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-brand-accent mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:text-white animate-subtle-pulse">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white">{title}</h3>
    <p className="mt-2 text-slate-400 flex-grow text-sm">{description}</p>
  </button>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
  <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-brand-light text-brand-accent mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="mt-2 text-slate-400 text-sm">{description}</p>
  </div>
);

export const HomePage: React.FC<HomePageProps> = ({ onSelectRole }) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center text-center px-4 pt-32 pb-16 min-h-screen">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight animate-fade-in">
          Empowering Connections.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-violet-400">
            Inspiring Growth.
          </span>
        </h1>
        
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-brand-accent to-transparent my-8 animate-fade-in" style={{ animationDelay: '0.3s' }}></div>
        
        <p className="mt-0 text-xl md:text-2xl text-slate-300 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          Bridging the Gap
        </p>
        <p className="max-w-3xl mt-2 text-slate-400 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          MentorVerse revolutionizes the mentoring experience by leveraging cutting-edge AI technology to connect you with the perfect guide for your career journey.
        </p>

        <div id="role-selection" className="mt-12 w-full max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-in-up" style={{ animationDelay: '0.9s' }}>
          <RoleButton 
              icon={<MenteeIcon />}
              title="I'm a Mentee"
              description="Find the perfect mentor to help you achieve your career goals."
              onClick={() => onSelectRole('mentee')}
          />
          <RoleButton 
              icon={<MentorIcon />}
              title="I'm a Mentor"
              description="Share your expertise and help shape the next generation of leaders."
              onClick={() => onSelectRole('mentor')}
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-24 bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Why Choose MentorVerse?</h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">A suite of powerful tools designed for meaningful mentorship and collaborative learning.</p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <FeatureCard 
              icon={<SparklesIcon />}
              title="AI Mentor Matching"
              description="Our intelligent algorithm analyzes your profile to connect you with mentors whose expertise perfectly aligns with your career goals and desired skills."
            />
            <FeatureCard 
              icon={<CalendarIcon />}
              title="Seamless Scheduling"
              description="No more back-and-forth emails. View your mentor's real-time availability and book sessions directly on the platform in just a few clicks."
            />
            <FeatureCard 
              icon={<LightbulbIcon />}
              title="Collaborative Doubt Rooms"
              description="Got a quick question? Jump into a doubt room to brainstorm and get advice from a community of peers and available mentors in real-time."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Mission</h2>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            MentorVerse was born from a simple idea: that the right guidance can change a career trajectory. We saw a gap between aspiring professionals and the experienced leaders who could guide them. Our mission is to bridge that gap using intelligent technology, creating a universe of connections where ambition meets wisdom. We believe in empowering growth, one mentorship session at a time.
          </p>
        </div>
      </section>
    </div>
  );
};