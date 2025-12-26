import React, { useState, useEffect, useRef } from 'react';
import type { MenteeProfile } from '../types';

interface MenteeProfileFormProps {
  onSubmit: (profile: MenteeProfile) => Promise<void>;
  isLoading: boolean;
  initialProfile: MenteeProfile;
  submitButtonContent?: React.ReactNode;
  compact?: boolean;
}

const TextAreaField: React.FC<{
  id: keyof MenteeProfile;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  compact?: boolean;
}> = ({ id, label, placeholder, value, onChange, compact }) => (
  <div>
    <label htmlFor={id} className={`block font-medium text-gray-300 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
      {label}
    </label>
    <textarea
      id={id}
      name={id}
      rows={compact ? 2 : 3}
      className={`block w-full px-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary transition-all ${compact ? 'py-1.5 text-sm' : 'py-2 sm:text-sm'}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

const InputField: React.FC<{
  id: keyof MenteeProfile;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  compact?: boolean;
}> = ({ id, label, placeholder, value, onChange, compact }) => (
  <div>
    <label htmlFor={id} className={`block font-medium text-gray-300 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
      {label}
    </label>
    <input
      id={id}
      name={id}
      type="text"
      className={`block w-full px-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary transition-all ${compact ? 'py-1.5 text-sm' : 'py-2 sm:text-sm'}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

export const MenteeProfileForm: React.FC<MenteeProfileFormProps> = ({ onSubmit, isLoading, initialProfile, submitButtonContent, compact }) => {
  const [profile, setProfile] = useState<MenteeProfile>(initialProfile);
  const [imagePreview, setImagePreview] = useState<string>(initialProfile.avatar || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(initialProfile);
    setImagePreview(initialProfile.avatar || '');
  }, [initialProfile]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    setProfile((prev) => ({ ...prev, [name]: items }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setProfile((prev) => ({ ...prev, avatar: base64String }));
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setProfile((prev) => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(profile);
  };

  const fieldSpacingClass = compact ? 'space-y-4' : 'space-y-6';
  const sectionSpacingClass = compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 gap-4';
  const headingClass = compact ? 'text-lg' : 'text-xl';
  const buttonClass = compact ? 'py-2 text-sm' : 'py-3 text-sm';

  return (
    <form onSubmit={handleSubmit} className={fieldSpacingClass}>
      <h2 className={`${headingClass} font-semibold text-gray-100`}>Your Profile</h2>

      {/* Profile Picture Upload */}
      {!compact && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            {/* Image Preview */}
            <div className="relative">
              <img
                src={imagePreview || 'https://via.placeholder.com/100?text=No+Image'}
                alt="Profile preview"
                className="h-24 w-24 rounded-full object-cover border-2 border-slate-600"
              />
              {isUploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Upload Buttons */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all"
              >
                {imagePreview ? 'Change Picture' : 'Upload Picture'}
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="inline-flex items-center px-4 py-2 border border-red-600 rounded-md shadow-sm text-sm font-medium text-red-400 bg-slate-700 hover:bg-red-900 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                >
                  Remove Picture
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Upload a profile picture (max 5MB). Supported formats: JPG, PNG, GIF
          </p>
        </div>
      )}

      <div className={sectionSpacingClass}>
        <InputField
          id="name"
          label="Full Name"
          placeholder="e.g., Alex Johnson"
          value={profile.name}
          onChange={handleInputChange}
          compact={compact}
        />
        <InputField
          id="email"
          label="Email"
          placeholder="e.g., alex@example.com"
          value={profile.email}
          onChange={handleInputChange}
          compact={compact}
        />
        {!compact && (
          <>
            <InputField
              id="college"
              label="College"
              placeholder="e.g., Stanford University"
              value={profile.college}
              onChange={handleInputChange}
            />
            <InputField
              id="course"
              label="Course"
              placeholder="e.g., B.S. Computer Science"
              value={profile.course}
              onChange={handleInputChange}
            />
          </>
        )}
        <InputField
          id="title"
          label="Title"
          placeholder="e.g., Aspiring Software Engineer"
          value={profile.title}
          onChange={handleInputChange}
          compact={compact}
        />
        {!compact && (
          <TextAreaField
            id="bio"
            label="Bio"
            placeholder="Tell mentors about yourself, your interests, and goals"
            value={profile.bio}
            onChange={handleTextareaChange}
          />
        )}
        <TextAreaField
          id="experience"
          label="Experience"
          placeholder="Summarize your relevant experience (internships, projects, roles)"
          value={profile.experience}
          onChange={handleTextareaChange}
          compact={compact}
        />
        <InputField
          id="interests"
          label="Interests"
          placeholder="e.g., AI/ML, FinTech, Product Design"
          value={profile.interests.join(', ')}
          onChange={handleArrayInputChange}
          compact={compact}
        />
        <InputField
          id="skills"
          label="Skills"
          placeholder="e.g., React, TypeScript, Public Speaking"
          value={profile.skills.join(', ')}
          onChange={handleArrayInputChange}
          compact={compact}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full flex justify-center items-center gap-2 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-dark hover:to-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${buttonClass}`}
      >
        {isLoading ? 'Processing...' : submitButtonContent ?? 'Save Profile'}
      </button>
    </form>
  );
};