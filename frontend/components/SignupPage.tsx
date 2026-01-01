
import React, { useState, FormEvent } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { apiService } from '../services/api';

interface SignupPageProps {
  role: 'mentor' | 'mentee';
  onSignup: (userData: { id: string; name: string; email: string; role: 'mentor' | 'mentee' }) => Promise<void>;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ role, onSignup, onSwitchToLogin, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name && email && password) {
      setError('');
      setIsLoading(true);
      try {
        const response = await apiService.signup({ name: name.trim(), email: email.trim().toLowerCase(), password: password.trim(), role });
        await onSignup(response.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const roleName = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="relative w-full max-w-md p-8 space-y-8 bg-slate-900/50 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-700 animate-fade-in">
         <button 
          onClick={onBack} 
          className="absolute top-4 left-4 flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-brand-accent transition-colors"
          aria-label="Go back to role selection"
        >
          <ArrowLeftIcon />
          Back
        </button>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-white">
            MentorVerse
          </h1>
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-100">
            Create {roleName} Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Start your journey with us today.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-900/50 border border-red-500 p-3">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-600 bg-slate-800 placeholder-slate-400 text-white rounded-t-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address-signup" className="sr-only">Email address</label>
              <input
                id="email-address-signup"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-600 bg-slate-800 placeholder-slate-400 text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password-signup" className="sr-only">Password</label>
              <input
                id="password-signup"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-600 bg-slate-800 placeholder-slate-400 text-white rounded-b-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-brand-accent hover:text-white"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary/90 hover:to-brand-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>
        </form>
         <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="font-medium text-brand-accent hover:text-white">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};