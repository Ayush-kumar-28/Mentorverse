import React, { useState } from 'react';
import type { MenteeProfile } from '../types';
import { MenteeProfileForm } from './MenteeProfileForm';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface MenteeProfileViewProps {
    menteeProfile: MenteeProfile;
    onUpdateProfile: (profile: MenteeProfile) => Promise<MenteeProfile>;
}

export const MenteeProfileView: React.FC<MenteeProfileViewProps> = ({ menteeProfile, onUpdateProfile }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSaveProfile = async (profile: MenteeProfile) => {
        setIsSaving(true);
        setIsSaved(false);
        setErrorMessage(null);
        try {
            await onUpdateProfile(profile);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update profile';
            setErrorMessage(message);
        } finally {
            setIsSaving(false);
        }
    };

    const { bio, experience, college, course, interests, skills, avatar } = menteeProfile;

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
             <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2">My Profile</h2>
            <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8">Keep your information up to date so we can find the best mentors for you.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
                <div className="lg:col-span-1">
                    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700 space-y-4">
                         <img 
                            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover mx-auto border border-slate-600" 
                            src={avatar || 'https://picsum.photos/seed/mentee-profile/200'}
                            alt={bio ? `${bio.slice(0, 50)} avatar` : 'Profile avatar'} 
                        />
                        <div className="space-y-3">
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-brand-accent uppercase tracking-wide">Bio</h3>
                                <p className="text-xs sm:text-sm text-gray-300 whitespace-pre-line">
                                    {bio || 'Add a short introduction about yourself to help mentors understand your journey.'}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-brand-accent uppercase tracking-wide">Experience</h3>
                                <p className="text-xs sm:text-sm text-gray-300 whitespace-pre-line">
                                    {experience || 'Highlight your recent roles, internships, or projects.'}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-brand-accent uppercase tracking-wide">Education</h3>
                                <p className="text-xs sm:text-sm text-gray-300">
                                    {college ? `${college}${course ? ` • ${course}` : ''}` : 'Add your college and course details'}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-brand-accent uppercase tracking-wide">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {skills.length > 0 ? (
                                        skills.map((skill) => (
                                            <span key={skill} className="inline-flex items-center rounded-full bg-brand-accent/10 px-2 sm:px-3 py-1 text-xs font-medium text-brand-accent">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-xs sm:text-sm text-gray-400">Add the skills you have experience with.</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-brand-accent uppercase tracking-wide">Interests</h3>
                                <div className="flex flex-wrap gap-2">
                                    {interests.length > 0 ? (
                                        interests.map((interest) => (
                                            <span key={interest} className="inline-flex items-center rounded-full bg-violet-500/10 px-2 sm:px-3 py-1 text-xs font-medium text-violet-300">
                                                {interest}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-xs sm:text-sm text-gray-400">Tell us the industries or topics you want to explore.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700">
                       <MenteeProfileForm
                            onSubmit={handleSaveProfile}
                            isLoading={isSaving}
                            initialProfile={menteeProfile}
                            submitButtonContent="Save Changes"
                        />
                        {errorMessage && (
                            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {errorMessage}
                            </div>
                        )}
                        {isSaved && (
                            <div className="mt-4 flex items-center gap-2 text-green-400 animate-fade-in">
                                <CheckCircleIcon />
                                <span className="text-sm font-medium">Profile updated successfully!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};