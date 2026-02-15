import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'bill' | 'budget' | 'market' | 'security' | 'info' | 'success' | 'warning';
    isRead: boolean;
    createdAt: string;
}

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications?limit=50');
            setNotifications(res.data.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    const getRelativeDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return 'Last Week';
        return date.toLocaleDateString();
    };

    const getTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Group by relative date
    const groupedNotifications = notifications.reduce((groups, notif) => {
        const date = getRelativeDate(notif.createdAt);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(notif);
        return groups;
    }, {} as Record<string, Notification[]>);

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
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
                    >
                        Mark all read
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 max-w-2xl mx-auto space-y-6">
                {loading ? (
                    <div className="text-center py-12 text-slate-400">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">No notifications</div>
                ) : (
                    Object.entries(groupedNotifications).map(([date, items]) => (
                        <div key={date}>
                            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">{date}</h2>
                            <div className="bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                                {items.map((notif, index) => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 flex gap-4 ${index !== items.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''} ${!notif.isRead ? 'bg-blue-50/10 dark:bg-blue-500/5' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'bill' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                                            notif.type === 'warning' || notif.type === 'budget' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                                notif.type === 'market' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                    notif.type === 'success' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                                                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                            <span className="material-symbols-outlined text-xl">
                                                {notif.type === 'bill' ? 'receipt_long' :
                                                    notif.type === 'warning' || notif.type === 'budget' ? 'warning' :
                                                        notif.type === 'market' ? 'trending_up' :
                                                            notif.type === 'success' ? 'celebration' :
                                                                notif.type === 'security' ? 'security' : 'notifications'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{notif.title}</h3>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2 text-right">
                                                    {getTime(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{notif.message}</p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {!loading && notifications.length > 0 && (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm">
                        No more notifications
                    </div>
                )}
            </div>
        </div>
    );
};


export default NotificationsPage;
