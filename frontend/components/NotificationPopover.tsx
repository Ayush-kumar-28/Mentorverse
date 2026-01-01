import React from 'react';
import { ClockIcon } from './icons/ClockIcon';
import { BookIcon } from './icons/BookIcon';
import { BellIcon } from './icons/BellIcon';

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'session' | 'workshop' | 'system';
    read: boolean;
}

interface NotificationPopoverProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkAsRead: (id: string) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ notifications, onClose, onMarkAsRead }) => {
    return (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl z-[9999] overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 backdrop-blur-sm">
                <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                    <BellIcon className="w-4 h-4 text-brand-accent" />
                    Notifications
                </h3>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                    Close
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-700/50">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-slate-700/30 transition-colors cursor-pointer ${notification.read ? 'opacity-60' : 'bg-slate-700/10'}`}
                                onClick={() => onMarkAsRead(notification.id)}
                            >
                                <div className="flex gap-3 items-start">
                                    <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${notification.type === 'session' ? 'bg-blue-500/20 text-blue-400' :
                                            notification.type === 'workshop' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-slate-500/20 text-slate-400'
                                        }`}>
                                        {notification.type === 'session' && <ClockIcon />}
                                        {notification.type === 'workshop' && <BookIcon />}
                                        {notification.type === 'system' && <BellIcon />}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-medium ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                                            {notification.title}
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
                                            {notification.time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500">
                            <BellIcon className="w-6 h-6" />
                        </div>
                        <p className="text-slate-400 text-sm">No new notifications</p>
                        <p className="text-slate-500 text-xs mt-1">We'll notify you about upcoming sessions</p>
                    </div>
                )}
            </div>

            {notifications.length > 0 && (
                <div className="p-3 bg-slate-800/50 border-t border-slate-700 text-center">
                    <button className="text-xs text-brand-accent hover:text-brand-primary transition-colors font-medium">
                        Mark all as read
                    </button>
                </div>
            )}
        </div>
    );
};
