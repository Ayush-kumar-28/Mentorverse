import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Mentor, BookSessionHandler } from '../types';
import { VideoIcon } from './icons/VideoIcon';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
  onJoinCall: (mentor: Mentor) => void;
  onBookSession: BookSessionHandler;
  onNavigateToSessions?: () => void;
}

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
    // Add blank days for the start of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`blank-${i}`} className="text-center p-2"></div>);
    }
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isPast = date < today;
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
      const isToday = date.getTime() === today.getTime();
      const hasAvailability = availableDates.has(formatDateKey(date));

      const classNames = `text-center p-2 rounded-full cursor-pointer transition-colors text-sm relative text-gray-700 ${
        isPast || !hasAvailability ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-brand-light hover:!text-brand-accent'
      } ${isSelected ? 'bg-brand-primary !text-white font-bold' : ''} ${
        !isSelected && isToday ? 'bg-indigo-100 text-brand-primary font-semibold' : ''
      }`;
      days.push(
        <div key={day} className={classNames} onClick={() => !isPast && hasAvailability && onDateSelect(date)}>
          {day}
          {hasAvailability && !isSelected && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 bg-brand-secondary rounded-full"></div>}
        </div>
      );
    }
    return days;
  };
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <button onClick={handlePrevMonth} className="p-1 rounded-full text-gray-600 hover:bg-gray-100">&lt;</button>
        <h4 className="font-semibold text-gray-800">{`${monthName} ${currentYear}`}</h4>
        <button onClick={handleNextMonth} className="p-1 rounded-full text-gray-600 hover:bg-gray-100">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map(day => <div key={day} className="text-center font-medium text-xs text-gray-500">{day}</div>)}
        {renderDays()}
      </div>
    </div>
  );
};


export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, mentor, onJoinCall, onBookSession, onNavigateToSessions }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menteeName, setMenteeName] = useState('');
  const [menteeEmail, setMenteeEmail] = useState('');
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const mentorAvailableDates = useMemo(() => {
    return new Set(Object.keys(mentor.availability || {}));
  }, [mentor.availability]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !mentor.availability) {
        return [];
    }
    const dateKey = formatDateKey(selectedDate);
    return mentor.availability[dateKey] || [];
  }, [selectedDate, mentor.availability]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset form on open
      setIsSubmitted(false);
      setIsSubmitting(false);
      setMenteeName('');
      setMenteeEmail('');
      setReason('');
      setSelectedDate(null);
      setSelectedTime(null);
      setErrorMessage(null);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  }
  
  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const hasAvailableDates = mentorAvailableDates.size > 0;

  const buildSupportPrompt = (scenario: 'no-dates' | 'no-slots' | 'booking-error') => {
    const details: string[] = [];

    if (scenario === 'no-dates') {
      details.push(`Mentor ${mentor.name} currently has no available sessions.`);
    } else if (scenario === 'no-slots') {
      details.push(`Mentor ${mentor.name} is unavailable for the requested slot.`);
    } else {
      details.push(`The booking attempt with mentor ${mentor.name} failed.`);
    }

    const dateLabel = formatSelectedDate();
    if (dateLabel) {
      details.push(`Requested date: ${dateLabel}.`);
    }
    if (selectedTime) {
      details.push(`Preferred time: ${selectedTime}.`);
    }
    const trimmedReason = reason.trim();
    if (trimmedReason) {
      details.push(`Topic to cover: ${trimmedReason}.`);
    }

    details.push('Provide clear guidance, answer the mentee’s doubt, and outline practical next steps.');
    details.push('Share 2-3 trustworthy video resources with direct links to help them learn immediately.');

    return details.join(' ');
  };

  const launchChatbotSupport = (scenario: 'no-dates' | 'no-slots' | 'booking-error') => {
    const prompt = buildSupportPrompt(scenario);
    if (!prompt.trim() || typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent('mentorverse:chatbot-support', { detail: { prompt } }));
  };

  const buildScheduledStart = () => {
    if (!selectedDate || !selectedTime) {
      return null;
    }
    const [timePart, meridiem] = selectedTime.split(' ');
    const [hourPart, minutePart] = timePart.split(':');
    let hours = parseInt(hourPart, 10);
    const minutes = parseInt(minutePart, 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }
    const upperMeridiem = meridiem?.toUpperCase() ?? '';
    if (upperMeridiem === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (upperMeridiem === 'AM' && hours === 12) {
      hours = 0;
    }
    const scheduled = new Date(selectedDate.getTime());
    scheduled.setHours(hours, minutes, 0, 0);
    return scheduled.toISOString();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedDate && selectedTime && menteeName && menteeEmail && reason) {
      const scheduledStart = buildScheduledStart();
      if (!scheduledStart) {
        setErrorMessage('Unable to determine session time. Please select a valid slot.');
        return;
      }
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        await onBookSession({
          mentor,
          menteeName,
          menteeEmail,
          reason,
          scheduledStart,
          durationMinutes: 30,
        });
        setIsSubmitted(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to book session';
        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleJoinCall = () => {
    onJoinCall(mentor);
    onClose();
  }


  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto transform transition-all animate-slide-in-up flex flex-col lg:flex-row text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Mentor Info */}
        <div className="w-full lg:w-1/3 bg-slate-800 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-700">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full mx-auto overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {mentor.avatar ? (
                <img 
                  className="h-full w-full object-cover" 
                  src={mentor.avatar} 
                  alt={mentor.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling!.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`text-white font-bold text-lg sm:text-xl ${mentor.avatar ? 'hidden' : ''}`}>
                {mentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            </div>
            <div className="text-center mt-4 space-y-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-100">{mentor.name}</h3>
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
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-300 mb-2">Expertise:</p>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((skill, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-medium text-indigo-200 bg-brand-light/50 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
             <div className="mt-6 text-sm text-gray-400">
                <p>You're booking a 30-minute introductory session. Please be prepared with questions to make the most of your time.</p>
            </div>
        </div>

        {/* Right Side: Form / Confirmation */}
        <div className="w-full lg:w-2/3 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-gray-800">
                    {isSubmitted ? 'Session Booked!' : 'Book a session'}
                </h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors self-end sm:self-auto"
                    aria-label="Close modal"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {isSubmitted ? (
                 <div className="p-4 text-center animate-fade-in">
                    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="text-2xl font-bold text-gray-800">Your session is confirmed!</h3>
                    <p className="text-gray-600 mt-2 text-base max-w-md mx-auto">
                      A confirmation email and calendar invitation have been sent to {menteeEmail}. Your new session is now visible on the mentor dashboard.
                    </p>
                    
                    <div className="text-left max-w-sm mx-auto mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">Mentor:</span>
                            <span className="font-bold text-brand-primary">{mentor.name}</span>
                        </div>
                        {mentor.linkedin && (
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-500">LinkedIn:</span>
                                <a
                                    href={mentor.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-brand-primary hover:underline"
                                >
                                    View Profile
                                </a>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">Date:</span>
                            <span className="font-semibold text-slate-900">{formatSelectedDate()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">Time:</span>
                            <span className="font-semibold text-slate-900">{selectedTime}</span>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                           onClick={handleJoinCall}
                           className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <VideoIcon />
                            Join Video Call
                        </button>
                        {onNavigateToSessions && (
                            <button
                                onClick={() => {
                                    onNavigateToSessions();
                                    onClose();
                                }}
                                className="w-full sm:w-auto px-6 py-2 bg-brand-primary text-white font-semibold rounded-md hover:bg-brand-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                            >
                                View My Sessions
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                        >
                            Done
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="menteeName" className="block text-sm font-medium text-gray-700">Your Name</label>
                            <input type="text" id="menteeName" value={menteeName} onChange={e => setMenteeName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required />
                        </div>
                        <div>
                            <label htmlFor="menteeEmail" className="block text-sm font-medium text-gray-700">Your Email</label>
                            <input type="email" id="menteeEmail" value={menteeEmail} onChange={e => setMenteeEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Why do you want to connect with {mentor.name}?</label>
                        <textarea id="reason" rows={3} value={reason} onChange={e => setReason(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Select a Date</label>
                        {!hasAvailableDates && (
                          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            <p className="font-semibold text-slate-900">Mentor {mentor.name} doesn't have open time slots right now.</p>
                            <p className="mt-2">Open MentorVerse AI for immediate guidance and curated video resources.</p>
                            <button
                              type="button"
                              onClick={() => launchChatbotSupport('no-dates')}
                              className="mt-3 inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
                            >
                              Ask MentorVerse AI
                            </button>
                          </div>
                        )}
                        <Calendar 
                          selectedDate={selectedDate} 
                          onDateSelect={handleDateSelect}
                          availableDates={mentorAvailableDates}
                        />
                    </div>
                    {selectedDate && (
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Select a Time</label>
                             {availableTimeSlots.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  {availableTimeSlots.map(time => (
                                      <button
                                          type="button"
                                          key={time}
                                          onClick={() => setSelectedTime(time)}
                                          className={`p-2 rounded-md text-sm border transition-colors ${selectedTime === time ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 hover:bg-indigo-50 border-gray-300'}`}
                                      >
                                          {time}
                                      </button>
                                  ))}
                                </div>
                             ) : (
                                <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-4 text-center">
                                  <p className="text-sm text-gray-600">No available time slots for this date.</p>
                                  <button
                                    type="button"
                                    onClick={() => launchChatbotSupport('no-slots')}
                                    className="mt-3 inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
                                  >
                                    Ask MentorVerse AI for help
                                  </button>
                                </div>
                             )}
                        </div>
                    )}
                    {errorMessage && (
                        <div className="space-y-3 rounded-md border border-red-300 bg-red-50 px-3 py-3 text-sm text-red-700">
                          <p>{errorMessage}</p>
                          <button
                            type="button"
                            onClick={() => launchChatbotSupport('booking-error')}
                            className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
                          >
                            Ask MentorVerse AI now
                          </button>
                        </div>
                    )}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={!selectedDate || !selectedTime || !menteeName || !menteeEmail || !reason || isSubmitting}
                            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                           {isSubmitting ? 'Booking...' : 'Confirm & Book Session'}
                        </button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>,
    document.body
  );
};