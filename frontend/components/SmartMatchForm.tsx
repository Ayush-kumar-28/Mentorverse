import React, { useEffect, useMemo, useState } from 'react';
import type { MatchmakingProfile, SmartMatchFormState } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface SmartMatchFormProps {
  onSubmit: (profile: MatchmakingProfile) => void;
  isLoading: boolean;
  initialProfile: MatchmakingProfile;
}

type SmartMatchFieldKey = keyof SmartMatchFormState;

type FieldConfig = {
  id: SmartMatchFieldKey;
  label: string;
  placeholder: string;
  helper: string;
};

const FIELD_CONFIGS: FieldConfig[] = [
  {
    id: 'currentSkills',
    label: 'Current Skills & Experience',
    placeholder: 'Example: "React front-end development, Flutter mobile apps, led a campus hackathon.',
    helper: 'We use this to map you with mentors who can build on what you already know.',
  },
  {
    id: 'desiredSkills',
    label: 'Skills You Want to Develop',
    placeholder: 'Example: "Cloud architecture, systems design, mentoring leadership."',
    helper: 'Clear learning goals help mentors prepare actionable paths for you.',
  },
  {
    id: 'careerGoals',
    label: 'Short & Long-Term Career Goals',
    placeholder: 'Example: "2-year goal: land an SDE role; 5-year goal: grow into a product-minded tech lead."',
    helper: 'Mentors consider your timeline, target roles, and industries while recommending next steps.',
  },
  {
    id: 'industryInterests',
    label: 'Industries or Domains That Inspire You',
    placeholder: 'Example: "HealthTech, data-driven sustainability, mission-oriented startups."',
    helper: 'Interest alignment improves the chemistry and relevance of each match.',
  },
];

const DEFAULT_FORM_STATE: SmartMatchFormState = {
  currentSkills: '',
  desiredSkills: '',
  careerGoals: '',
  industryInterests: '',
};

export const SmartMatchForm: React.FC<SmartMatchFormProps> = ({ onSubmit, isLoading, initialProfile }) => {
  const [formState, setFormState] = useState<SmartMatchFormState>(() => ({
    ...DEFAULT_FORM_STATE,
    ...initialProfile,
  }));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormState({
      ...DEFAULT_FORM_STATE,
      ...initialProfile,
    });
  }, [initialProfile]);

  const handleChange = (field: SmartMatchFieldKey) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) {
      setError(null);
    }
  };

  const sanitizedProfile = useMemo(() => {
    return (Object.keys(formState) as SmartMatchFieldKey[]).reduce((acc, key) => {
      acc[key] = formState[key].trim();
      return acc;
    }, {} as SmartMatchFormState);
  }, [formState]);

  const hasEmptyRequiredField = useMemo(() => {
    return (Object.values(sanitizedProfile) as string[]).some((value) => value.length === 0);
  }, [sanitizedProfile]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (hasEmptyRequiredField) {
      setError('Please answer each question so we can generate accurate mentor matches.');
      return;
    }

    const matchmakingProfile: MatchmakingProfile = { ...sanitizedProfile };
    onSubmit(matchmakingProfile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/20 text-brand-accent">
            <SparklesIcon />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Smart Mentor Matchmaking</h2>
            <p className="text-sm text-slate-400">Share a focused snapshot of where you are and where you want to go.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {FIELD_CONFIGS.map((field) => (
          <label key={field.id} htmlFor={field.id} className="block space-y-2">
            <div>
              <span className="block text-sm font-semibold text-slate-200">{field.label}</span>
              <span className="mt-1 block text-xs text-slate-400">{field.helper}</span>
            </div>
            <textarea
              id={field.id}
              name={field.id}
              className="block w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-sm text-white shadow-sm placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/60 disabled:opacity-60"
              rows={field.id === 'careerGoals' ? 4 : 3}
              placeholder={field.placeholder}
              value={formState[field.id]}
              onChange={handleChange(field.id)}
              disabled={isLoading}
            />
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-brand-dark hover:to-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Finding mentors...' : 'Find My Mentor Matches'}
        </button>
        <p className="text-xs text-slate-500">
          We only send these answers to our matchmaking engine—your broader profile stays untouched.
        </p>
      </div>
    </form>
  );
};