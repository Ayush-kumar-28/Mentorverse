import React, { useState, FormEvent } from 'react';
import type { MentorProfile } from '../types';
import { mentorProfileService } from '../services/mentorProfileService';
import { apiService } from '../services/api';

interface MentorProfileSetupProps {
  initialProfile: Partial<MentorProfile>;
  onComplete: (profile: MentorProfile) => void;
  onSkip: () => void;
  onLogout?: () => void;
}

export const MentorProfileSetup: React.FC<MentorProfileSetupProps> = ({ 
  initialProfile, 
  onComplete, 
  onSkip,
  onLogout 
}) => {
  const [profile, setProfile] = useState<Partial<MentorProfile>>({
    name: initialProfile.name || '',
    email: initialProfile.email || '',
    title: '',
    company: '',
    bio: '',
    experience: '',
    expertise: [],
    linkedin: '',
    yearsOfExperience: 0,
    ...initialProfile
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [profileImage, setProfileImage] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'Name must be at least 2 characters long';
        }
        if (value.trim().length > 50) {
          return 'Name cannot exceed 50 characters';
        }
        break;
      case 'title':
        if (!value || value.trim().length < 2) {
          return 'Job title is required and must be at least 2 characters';
        }
        if (value.trim().length > 100) {
          return 'Job title cannot exceed 100 characters';
        }
        break;
      case 'company':
        if (!value || value.trim().length < 2) {
          return 'Company name is required and must be at least 2 characters';
        }
        if (value.trim().length > 100) {
          return 'Company name cannot exceed 100 characters';
        }
        break;
      case 'bio':
        if (!value || value.trim().length < 50) {
          return 'Bio must be at least 50 characters long';
        }
        if (value.trim().length > 1000) {
          return 'Bio cannot exceed 1000 characters';
        }
        break;
      case 'experience':
        if (!value || value.trim().length < 10) {
          return 'Experience summary must be at least 10 characters long';
        }
        if (value.trim().length > 2000) {
          return 'Experience summary cannot exceed 2000 characters';
        }
        break;
      case 'linkedin':
        if (value && value.trim() && !value.match(/^https?:\/\/(www\.)?linkedin\.com\/.*/)) {
          return 'Please provide a valid LinkedIn URL';
        }
        break;
      case 'yearsOfExperience':
        if (value < 0 || value > 50) {
          return 'Years of experience must be between 0 and 50';
        }
        break;
      case 'expertise':
        if (!value || !Array.isArray(value) || value.length === 0) {
          return 'At least one expertise area is required';
        }
        break;
    }
    return null;
  };

  const handleInputChange = (field: keyof MentorProfile, value: string | number) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Validate field on change for immediate feedback
    const error = validateField(field, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleAddExpertise = () => {
    if (expertiseInput.trim() && !profile.expertise?.includes(expertiseInput.trim())) {
      const newExpertise = [...(profile.expertise || []), expertiseInput.trim()];
      setProfile(prev => ({
        ...prev,
        expertise: newExpertise
      }));
      setExpertiseInput('');
      
      // Clear expertise validation error when adding
      if (fieldErrors.expertise) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.expertise;
          return newErrors;
        });
      }
    }
  };

  const handleRemoveExpertise = (expertise: string) => {
    const newExpertise = profile.expertise?.filter(e => e !== expertise) || [];
    setProfile(prev => ({
      ...prev,
      expertise: newExpertise
    }));
    
    // Validate expertise after removal
    const error = validateField('expertise', newExpertise);
    if (error) {
      setFieldErrors(prev => ({ ...prev, expertise: error }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
        setProfile(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage('');
    setImageFile(null);
    setProfile(prev => ({ ...prev, avatar: '' }));
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate all required fields
    const fieldsToValidate = [
      'name', 'title', 'company', 'bio', 'experience', 'linkedin', 'yearsOfExperience', 'expertise'
    ];
    
    fieldsToValidate.forEach(field => {
      const value = field === 'expertise' ? profile.expertise : profile[field as keyof MentorProfile];
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
      }
    });
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    if (!validateAllFields()) {
      setError('Please fix the validation errors below before submitting.');
      return;
    }
    
    if (!isProfileComplete()) {
      setError('Please complete all required fields.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const profileData = {
        name: profile.name!,
        title: profile.title!,
        company: profile.company!,
        bio: profile.bio!,
        experience: profile.experience!,
        expertise: profile.expertise!,
        linkedin: profile.linkedin || '',
        yearsOfExperience: profile.yearsOfExperience || 0,
        availability: profile.availability || {},
        avatar: profile.avatar || '',
      };

      const createdProfile = await mentorProfileService.createProfile(profileData);
      onComplete(createdProfile);
    } catch (err) {
      console.error('Failed to create mentor profile:', err);
      
      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes('Validation failed')) {
          setError('Please check your input and try again. Make sure all fields meet the requirements.');
        } else if (err.message.includes('User not found')) {
          setError('Authentication error. Please logout and login again to continue.');
        } else if (err.message.includes('Invalid token')) {
          setError('Your session has expired. Please logout and login again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isProfileComplete = () => {
    return profile.name && profile.email && profile.title && profile.company && 
           profile.bio && profile.experience && (profile.expertise?.length || 0) > 0;
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleLogout = () => {
    apiService.logout();
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: reload the page to clear state
      window.location.reload();
    }
  };

  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    const hasError = fieldErrors[fieldName];
    return hasError 
      ? `${baseClassName} border-red-500 focus:ring-red-500` 
      : baseClassName;
  };

  const renderFieldError = (fieldName: string) => {
    const error = fieldErrors[fieldName];
    return error ? (
      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </p>
    ) : null;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Basic Information</h3>
        <div className="space-y-4">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {profileImage ? (
                <div className="relative">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-700 border-2 border-dashed border-slate-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {profileImage ? 'Change Photo' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-400 mt-1">Max 5MB, JPG/PNG</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={profile.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={getFieldClassName('name', "w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500")}
              placeholder="Enter your full name"
              required
            />
            {renderFieldError('name')}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={profile.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Current Job Title *
            </label>
            <input
              type="text"
              value={profile.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={getFieldClassName('title', "w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500")}
              placeholder="e.g., Senior Software Engineer"
              required
            />
            {renderFieldError('title')}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Company *
            </label>
            <input
              type="text"
              value={profile.company || ''}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className={getFieldClassName('company', "w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500")}
              placeholder="e.g., Google, Microsoft, Startup Inc."
              required
            />
            {renderFieldError('company')}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Years of Experience
            </label>
            <input
              type="number"
              value={profile.yearsOfExperience || 0}
              onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
              className={getFieldClassName('yearsOfExperience', "w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500")}
              placeholder="0"
              min="0"
              max="50"
            />
            {renderFieldError('yearsOfExperience')}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Professional Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Professional Bio * <span className="text-xs text-slate-400">(min 50 characters)</span>
            </label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className={getFieldClassName('bio', "w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500")}
              placeholder="Tell us about your professional background, achievements, and what makes you a great mentor..."
              required
            />
            <div className="flex justify-between items-center mt-1">
              {renderFieldError('bio')}
              <span className="text-xs text-slate-400">
                {(profile.bio || '').length}/1000 characters
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Experience Summary * <span className="text-xs text-slate-400">(min 10 characters)</span>
            </label>
            <textarea
              value={profile.experience || ''}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              rows={3}
              className={getFieldClassName('experience', "w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500")}
              placeholder="Briefly describe your career journey and key experiences..."
              required
            />
            <div className="flex justify-between items-center mt-1">
              {renderFieldError('experience')}
              <span className="text-xs text-slate-400">
                {(profile.experience || '').length}/2000 characters
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              LinkedIn Profile
            </label>
            <input
              type="url"
              value={profile.linkedin || ''}
              onChange={(e) => handleInputChange('linkedin', e.target.value)}
              className={getFieldClassName('linkedin', "w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500")}
              placeholder="https://linkedin.com/in/yourprofile"
            />
            {renderFieldError('linkedin')}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Areas of Expertise</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Add Your Expertise *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())}
                className={getFieldClassName('expertise', "flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500")}
                placeholder="e.g., React, Machine Learning, Product Management"
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                disabled={!expertiseInput.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>
            {renderFieldError('expertise')}
          </div>

          {profile.expertise && profile.expertise.length > 0 && (
            <div>
              <p className="text-sm text-slate-300 mb-3">Your Expertise Areas:</p>
              <div className="flex flex-wrap gap-2">
                {profile.expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveExpertise(skill)}
                      className="text-blue-300 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-2">💡 Tip</h4>
            <p className="text-sm text-slate-400">
              Add specific skills, technologies, or areas where you can provide valuable mentorship. 
              This helps mentees find you more easily!
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white relative">
          {/* Logout Button - Top Right */}
          <button
            onClick={handleLogout}
            className="absolute top-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm border border-white/20"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>

          <h2 className="text-2xl font-bold mb-2">Complete Your Mentor Profile</h2>
          <p className="text-blue-100">Help mentees discover and connect with you</p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Step {currentStep} of 3</span>
              <span>{Math.round((currentStep / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-blue-800/50 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200">
              <p className="text-sm">⚠️ {error}</p>
            </div>
          )}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Previous
                </button>
              )}
              <button
                type="button"
                onClick={onSkip}
                className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
              >
                Skip for now
              </button>
            </div>

            <div>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={currentStep === 1 && (!profile.name || !profile.title || !profile.company)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isProfileComplete() || isLoading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating Profile...
                    </>
                  ) : (
                    'Complete Profile'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};