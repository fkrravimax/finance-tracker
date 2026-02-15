import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    time?: string;
    read?: boolean;
    isRead?: boolean;
    createdAt?: string;
}

interface NotificationBellProps {
    notifications: Notification[];
    unreadCount: number;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
    notifications,
    unreadCount,
    isOpen,
    onToggle,
    onClose,
}) => {
    const navigate = useNavigate();

    // Limit to 5 notifications for the popup
    const recentNotifications = notifications.slice(0, 5);

    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className="p-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-[#2b2616] rounded-full transition-colors relative"
            >
                <span className={`material-symbols-outlined ${isOpen ? 'font-variation-FILL-1' : ''}`}>notifications</span>
                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1a160b]"></span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                    ></div>
                    <div className="absolute right-0 top-12 w-[85vw] max-w-[320px] bg-white dark:bg-[#1a160b] rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                            <h3 className="font-bold text-slate-800 dark:text-white">Recent Notifications</h3>
                            <button
                                onClick={() => navigate('/notifications')}
                                className="text-xs font-bold text-primary hover:text-primary-dark"
                            >
                                View all
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                            {recentNotifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
                                    <p className="text-sm">No notifications</p>
                                </div>
                            ) : (
                                recentNotifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 border-b border-slate-50 dark:border-white/5 transition-colors cursor-pointer
                                            ${!notif.read && !notif.isRead // Handle both potential property names
                                                ? 'bg-amber-50/80 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                                                : 'hover:bg-slate-50 dark:hover:bg-white/5'
                                            }`}
                                        onClick={() => navigate('/notifications')}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'bill' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                                                notif.type === 'warning' || notif.type === 'budget' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                                    notif.type === 'trend' || notif.type === 'market' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                        'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                                }`}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {notif.type === 'bill' ? 'receipt_long' :
                                                        notif.type === 'warning' || notif.type === 'budget' ? 'warning' :
                                                            notif.type === 'trend' || notif.type === 'market' ? 'trending_up' :
                                                                notif.type === 'security' ? 'security' : 'notifications'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight mb-1">{notif.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{notif.message}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                                                    {new Date(notif.time || (notif as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {(!notif.read && !notif.isRead) && (
                                                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-white/5 text-center">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/notifications');
                                }}
                                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                            >
                                View All Notifications
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
