import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Extended Mock Data for the full page view
    const ALL_NOTIFICATIONS = [
        {
            id: 1,
            title: 'Bill Reminder',
            message: 'Spotify Premium is due tomorrow ($10.99)',
            time: '2h ago',
            type: 'bill',
            read: true, // Assuming viewed from dropdown
            date: 'Today'
        },
        {
            id: 2,
            title: 'Budget Alert',
            message: 'You have exceeded 80% of your Dining budget',
            time: '5h ago',
            type: 'warning',
            read: true,
            date: 'Today'
        },
        {
            id: 3,
            title: 'Market Update',
            message: 'Bitcoin (BTC) is up +5.2% today!',
            time: '1d ago',
            type: 'trend',
            read: true,
            date: 'Yesterday'
        },
        {
            id: 4,
            title: 'Security Alert',
            message: 'New login detected from Mac OS',
            time: '2d ago',
            type: 'security',
            read: true,
            date: 'Yesterday'
        },
        {
            id: 5,
            title: 'Weekly Report',
            message: 'Your weekly spending report is ready to view.',
            time: '3d ago',
            type: 'info',
            read: true,
            date: 'Last Week'
        },
        {
            id: 6,
            title: 'Goal Reached',
            message: 'Congratulations! You reached your savings goal for "New Laptop".',
            time: '5d ago',
            type: 'success',
            read: true,
            date: 'Last Week'
        }
    ];

    // Group by date
    const groupedNotifications = ALL_NOTIFICATIONS.reduce((groups, notif) => {
        const date = notif.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(notif);
        return groups;
    }, {} as Record<string, typeof ALL_NOTIFICATIONS>);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#1a160b]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Notifications</h1>
                <div className="ml-auto">
                    <button className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                        Mark all read
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 max-w-2xl mx-auto space-y-6">
                {Object.entries(groupedNotifications).map(([date, items]) => (
                    <div key={date}>
                        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">{date}</h2>
                        <div className="bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                            {items.map((notif, index) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 flex gap-4 ${index !== items.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'bill' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                                            notif.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                                notif.type === 'trend' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                    notif.type === 'success' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                                                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                        <span className="material-symbols-outlined text-xl">
                                            {notif.type === 'bill' ? 'receipt_long' :
                                                notif.type === 'warning' ? 'warning' :
                                                    notif.type === 'trend' ? 'trending_up' :
                                                        notif.type === 'success' ? 'celebration' :
                                                            notif.type === 'security' ? 'security' : 'notifications'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{notif.title}</h3>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">{notif.time}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{notif.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm">
                    No more notifications
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
