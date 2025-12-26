import React, { useState, useEffect } from 'react';
import type { Mentor, WorkExperience } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface MentorEditProfileViewProps {
  mentor: Mentor;
  onSave: (updatedMentor: Mentor) => void;
  onCancel: () => void;
}

const InputField: React.FC<{id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean}> = ({ id, label, value, onChange, required = true }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
    <input
      type="text"
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
    />
  </div>
);

const TextAreaField: React.FC<{id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, rows?: number}> = ({ id, label, value, onChange, rows = 3 }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <textarea
            id={id}
            name={id}
            rows={rows}
            value={value}
            onChange={onChange}
            className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
        />
    </div>
);


export const MentorEditProfileView: React.FC<MentorEditProfileViewProps> = ({ mentor, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Mentor>(mentor);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(mentor);
    }, [mentor]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleExpertiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const expertiseArray = e.target.value.split(',').map(item => item.trim());
        setFormData(prev => ({ ...prev, expertise: expertiseArray }));
    };

    const handleExperienceChange = (index: number, field: keyof WorkExperience, value: string) => {
        const newExperience = [...(formData.experience || [])];
        newExperience[index] = { ...newExperience[index], [field]: value };
        setFormData(prev => ({ ...prev, experience: newExperience }));
    };

    const addExperience = () => {
        const newExperience = [...(formData.experience || []), { title: '', company: '', duration: '' }];
        setFormData(prev => ({ ...prev, experience: newExperience }));
    };

    const removeExperience = (index: number) => {
        const newExperience = [...(formData.experience || [])];
        newExperience.splice(index, 1);
        setFormData(prev => ({ ...prev, experience: newExperience }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            onSave(formData);
            setIsSaving(false);
        }, 1000);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-3xl font-bold text-gray-100">Edit Profile</h2>
                 <button onClick={onCancel} className="text-slate-400 hover:text-white" aria-label="Cancel editing">
                    <CloseIcon />
                </button>
            </div>
           
            <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="name" label="Full Name" value={formData.name} onChange={handleChange} />
                    <InputField id="email" label="Email" value={'jane.doe@example.com'} onChange={() => {}} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="title" label="Current Title" value={formData.title} onChange={handleChange} />
                    <InputField id="company" label="Current Company" value={formData.company} onChange={handleChange} />
                </div>
                 <TextAreaField id="bio" label="Your Bio" value={formData.bio || ''} onChange={handleChange} rows={4} />
                 <div>
                    <label htmlFor="expertise" className="block text-sm font-medium text-slate-300 mb-1">Expertise (comma-separated)</label>
                    <input
                        type="text"
                        id="expertise"
                        name="expertise"
                        value={formData.expertise.join(', ')}
                        onChange={handleExpertiseChange}
                        placeholder="e.g., System Design, Go, Kubernetes"
                        className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    />
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 border-t border-slate-700 pt-6">Work Experience</h3>
                    <div className="space-y-4">
                    {(formData.experience || []).map((exp, index) => (
                        <div key={index} className="bg-slate-700/50 p-4 rounded-md border border-slate-600 relative">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField id={`exp-title-${index}`} label="Job Title" value={exp.title} onChange={(e) => handleExperienceChange(index, 'title', e.target.value)} />
                                <InputField id={`exp-company-${index}`} label="Company" value={exp.company} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} />
                            </div>
                            <div className="mt-4">
                                <InputField id={`exp-duration-${index}`} label="Duration" value={exp.duration} onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)} />
                            </div>
                             <button type="button" onClick={() => removeExperience(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-400">
                                <CloseIcon />
                            </button>
                        </div>
                    ))}
                    </div>
                    <button type="button" onClick={addExperience} className="mt-4 px-4 py-2 text-sm font-medium rounded-md text-brand-accent bg-brand-light/50 hover:bg-brand-light transition-colors">
                        + Add Experience
                    </button>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-700">
                     <button type="button" onClick={onCancel} className="px-6 py-2 font-semibold rounded-lg shadow-md text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-dark hover:to-brand-primary transition-all duration-300 disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};