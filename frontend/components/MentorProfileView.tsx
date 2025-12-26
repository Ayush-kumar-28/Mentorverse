import React, { useState, useMemo } from 'react';
import type { MentorProfile } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { EditIcon } from './icons/EditIcon';

const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];

const Calendar: React.FC<{
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availableDates: Set<string>;
}> = ({ selectedDate, onDateSelect, availableDates }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`blank-${i}`} className="text-center p-2"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isPast = date < today;
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
      const isToday = date.getTime() === today.getTime();
      const hasAvailability = availableDates.has(formatDateKey(date));

      const classNames = `text-center p-2 rounded-full cursor-pointer transition-colors text-sm relative ${
        isPast ? 'text-gray-500 cursor-not-allowed' : 'hover:bg-brand-light'
      } ${isSelected ? 'bg-brand-primary text-white font-bold' : ''} ${
        !isSelected && isToday ? 'bg-indigo-900 text-brand-accent font-semibold' : ''
      }`;
      days.push(
        <div key={day} className={classNames} onClick={() => !isPast && onDateSelect(date)}>
          {day}
          {hasAvailability && !isSelected && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 bg-brand-secondary rounded-full"></div>}
        </div>
      );
    }
    return days;
  };
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mt-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-slate-700">&lt;</button>
        <h4 className="font-semibold text-slate-200">{`${monthName} ${currentYear}`}</h4>
        <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-slate-700">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map(day => <div key={day} className="text-center font-medium text-xs text-gray-400">{day}</div>)}
        {renderDays()}
      </div>
    </div>
  );
};

interface MentorProfileViewProps {
    mentor: MentorProfile;
    onEditProfile: () => void;
    onUpdateProfile?: (updates: Partial<MentorProfile>) => Promise<void>;
}

export const MentorProfileView: React.FC<MentorProfileViewProps> = ({ mentor, onEditProfile, onUpdateProfile }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [availability, setAvailability] = useState<Record<string, Set<string>>>(
        Object.entries(mentor.availability || {}).reduce((acc, [key, value]) => {
            acc[key] = new Set(value as string[]);
            return acc;
        }, {} as Record<string, Set<string>>)
    );
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [profileImage, setProfileImage] = useState<string>(mentor.avatar || '');
    const [imageUploadStatus, setImageUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

    // Update local state when mentor prop changes (e.g., after successful save)
    React.useEffect(() => {
        setProfileImage(mentor.avatar || '');
    }, [mentor.avatar]);

    const availableTimeSlots = useMemo(() => [
        '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ], []);
    
    const availableDates = useMemo(() => new Set(Object.keys(availability)), [availability]);

    const toggleTimeSlot = (time: string) => {
        if (!selectedDate) return;
        setSaveStatus('idle'); // Reset save status on edit
        const dateKey = formatDateKey(selectedDate);

        setAvailability(prev => {
            const newAvailability = { ...prev };
            const timesForDate = new Set(newAvailability[dateKey] || []);

            if (timesForDate.has(time)) {
                timesForDate.delete(time);
            } else {
                timesForDate.add(time);
            }

            if (timesForDate.size === 0) {
                delete newAvailability[dateKey];
            } else {
                newAvailability[dateKey] = timesForDate;
            }

            return newAvailability;
        });
    };
    
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setImageUploadStatus('uploading');

        // Create preview URL
        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = e.target?.result as string;
            setProfileImage(result);
            
            try {
                // Immediately save the image to backend
                if (onUpdateProfile) {
                    await onUpdateProfile({ avatar: result });
                    setImageUploadStatus('success');
                    
                    // Show success message for 3 seconds
                    setTimeout(() => {
                        setImageUploadStatus('idle');
                    }, 3000);
                } else {
                    setImageUploadStatus('error');
                    setTimeout(() => {
                        setImageUploadStatus('idle');
                    }, 3000);
                }
            } catch (error) {
                console.error('Error saving profile image:', error);
                setImageUploadStatus('error');
                // Revert the image on error
                setProfileImage(mentor.avatar || '');
                setTimeout(() => {
                    setImageUploadStatus('idle');
                }, 3000);
            }
        };
        reader.onerror = () => {
            setImageUploadStatus('error');
            setTimeout(() => {
                setImageUploadStatus('idle');
            }, 3000);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveChanges = async () => {
        setSaveStatus('saving');
        
        try {
            // Convert availability back to the format expected by the backend
            const availabilityForBackend = Object.entries(availability).reduce((acc, [key, value]) => {
                acc[key] = Array.from(value as Set<string>);
                return acc;
            }, {} as Record<string, string[]>);

            // Prepare updates (avatar is saved immediately on upload, so only save availability here)
            const updates: Partial<MentorProfile> = {
                availability: availabilityForBackend
            };

            // Call the update function if provided
            if (onUpdateProfile) {
                await onUpdateProfile(updates);
            }

            setSaveStatus('saved');
            console.log('Saved availability changes:', updates);
        } catch (error) {
            console.error('Error saving changes:', error);
            setSaveStatus('idle');
            alert('Failed to save changes. Please try again.');
        }
    };

    const timesForSelectedDate = selectedDate ? availability[formatDateKey(selectedDate)] || new Set() : new Set();

    return (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-semibold text-gray-200">Your Profile</h3>
                    <button onClick={onEditProfile} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md text-brand-accent bg-brand-light/50 hover:bg-brand-light transition-all">
                        <EditIcon className="h-4 w-4" />
                        Edit
                    </button>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                    <div className="relative h-24 w-24 rounded-full mx-auto overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group">
                        {profileImage ? (
                            <img 
                                className="h-full w-full object-cover" 
                                src={profileImage} 
                                alt={mentor.name}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling!.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <div className={`text-white font-bold text-xl ${profileImage ? 'hidden' : ''}`}>
                            {mentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        
                        {/* Image Upload Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer rounded-full">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                title="Click to change profile picture (Max 5MB)"
                                disabled={imageUploadStatus === 'uploading'}
                            />
                            <div className="text-white text-center pointer-events-none">
                                {imageUploadStatus === 'uploading' ? (
                                    <div className="animate-spin w-6 h-6 mx-auto mb-1">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </div>
                                ) : (
                                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                                <span className="text-xs font-medium">
                                    {imageUploadStatus === 'uploading' ? 'Uploading...' : 'Change Photo'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Image Upload Status and Instructions */}
                    <div className="text-center mt-2">
                        {imageUploadStatus !== 'idle' ? (
                            <div>
                                {imageUploadStatus === 'uploading' && (
                                    <span className="text-xs text-blue-400">Uploading image...</span>
                                )}
                                {imageUploadStatus === 'success' && (
                                    <span className="text-xs text-green-400">✓ Profile image saved successfully!</span>
                                )}
                                {imageUploadStatus === 'error' && (
                                    <span className="text-xs text-red-400">✗ Upload failed. Please try again.</span>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400">Hover over image to change profile photo</span>
                        )}
                    </div>
                    
                    <div className="text-center mt-4 space-y-2">
                        <div>
                            <h3 className="text-xl font-bold text-gray-100">{mentor.name}</h3>
                            <p className="text-sm text-brand-accent font-medium">{mentor.title}</p>
                            <p className="text-sm text-gray-400">{mentor.company}</p>
                        </div>
                        {mentor.linkedin && (
                            <a
                                href={mentor.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold text-brand-accent bg-brand-light/40 hover:bg-brand-light/60 rounded-md transition-colors"
                            >
                                View LinkedIn Profile
                            </a>
                        )}
                    </div>

                     {mentor.bio && (
                        <div className="mt-6 pt-6 border-t border-slate-700">
                             <p className="text-sm text-gray-300">{mentor.bio}</p>
                        </div>
                    )}
                    
                    <div className="mt-6">
                        <p className="text-sm font-semibold text-gray-300 mb-2">Your Expertise:</p>
                        <div className="flex flex-wrap gap-2">
                            {mentor.expertise.map((skill, i) => (
                                <span key={i} className="px-2 py-1 text-xs font-medium text-indigo-200 bg-brand-light/50 rounded-full">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {mentor.experience && (
                     <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Experience</h3>
                        <div className="pl-4 border-l-2 border-slate-700">
                            <p className="text-sm text-slate-300 leading-relaxed">{mentor.experience}</p>
                            {mentor.yearsOfExperience && (
                                <p className="text-xs text-slate-400 mt-2">{mentor.yearsOfExperience} years of experience</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="lg:col-span-2 space-y-6">
                 <h3 className="text-2xl font-semibold text-gray-200">Manage Your Availability</h3>
                 <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">1. Select a Date</label>
                        <Calendar 
                            selectedDate={selectedDate} 
                            onDateSelect={(date) => {
                                setSelectedDate(date);
                                setSaveStatus('idle');
                            }} 
                            availableDates={availableDates}
                        />
                    </div>
                    {selectedDate && (
                        <div className="mt-6 animate-fade-in">
                             <label className="block text-sm font-medium text-gray-300">2. Set Available Times for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</label>
                             <div className="grid grid-cols-3 gap-2 mt-2">
                                {availableTimeSlots.map(time => (
                                    <button
                                        type="button"
                                        key={time}
                                        onClick={() => toggleTimeSlot(time)}
                                        className={`p-2 rounded-md text-sm border transition-colors ${timesForSelectedDate.has(time) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-slate-700 hover:bg-brand-light/50 border-slate-600'}`}
                                    >
                                        {time}
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}
                 </div>
                 <div className="flex justify-end items-center gap-4">
                    {saveStatus === 'saved' && (
                        <div className="flex items-center gap-2 text-green-400 animate-fade-in">
                            <CheckCircleIcon />
                            <span className="text-sm font-medium">Changes saved!</span>
                        </div>
                    )}
                    <button 
                        onClick={handleSaveChanges}
                        disabled={saveStatus === 'saving'}
                        className="px-6 py-2 font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-dark hover:to-brand-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                    </button>
                 </div>
            </div>
        </div>
    );
};