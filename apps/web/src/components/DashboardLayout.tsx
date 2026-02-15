import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNavbar from './BottomNavbar';
import LogoText from './LogoText';
import QuickAddTransactionModal from './QuickAddTransactionModal';
import { UIProvider, useUI } from '../contexts/UIContext';
import { useSwipeable, type SwipeEventData } from 'react-swipeable';

interface DashboardLayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
}

const DashboardContent: React.FC<DashboardLayoutProps> = ({ children, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const { isQuickAddOpen, closeQuickAdd, editingTransaction } = useUI();

    const navigate = useNavigate();
    const location = useLocation();

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleToggleNotifications = () => {
        if (!isNotificationsOpen) {
            // Open dropdown and mark all as read
            setIsNotificationsOpen(true);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } else {
            setIsNotificationsOpen(false);
        }
    };

    const handleSwipeRight = (eventData: SwipeEventData) => {
        if ((eventData.event.target as HTMLElement).closest('[data-no-swipe="true"]')) return;
        if (isSidebarOpen) return; // Already leftmost

        const path = location.pathname;
        if (path === '/dashboard') {
            setIsSidebarOpen(true);
        } else if (path === '/transactions') {
            navigate('/dashboard');
        } else if (path === '/reports') {
            navigate('/transactions');
        } else if (path === '/settings') {
            navigate('/reports');
        }
    };

    const handleSwipeLeft = (eventData: SwipeEventData) => {
        if ((eventData.event.target as HTMLElement).closest('[data-no-swipe="true"]')) return;
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
            return;
        }

        const path = location.pathname;
        if (path === '/dashboard') {
            navigate('/transactions');
        } else if (path === '/transactions') {
            navigate('/reports');
        } else if (path === '/reports') {
            navigate('/settings');
        }
        // Settings is rightmost, do nothing
    };

    const handlers = useSwipeable({
        onSwipedRight: handleSwipeRight,
        onSwipedLeft: handleSwipeLeft,
        trackMouse: false,
        trackTouch: true,
        delta: 50, // Min distance to trigger swipe
    });

    return (
        <div
            {...handlers}
            className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white relative"
        >
            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar
                onLogout={onLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col w-full max-w-full pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0">
                {/* Mobile Header (Visible only on small screens) */}
                <div className="md:hidden flex items-center justify-between px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-slate-200 dark:border-white/5 bg-surface-light dark:bg-background-dark sticky top-0 z-50 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-slate-900 dark:bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-md shadow-slate-900/30 transform rotate-3">
                            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                        </span>
                        <LogoText className="text-xl" />
                    </div>

                    {/* Notification Button */}
                    <div className="relative">
                        <button
                            onClick={handleToggleNotifications}
                            className="p-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-[#2b2616] rounded-full transition-colors relative"
                        >
                            <span className={`material-symbols-outlined ${isNotificationsOpen ? 'font-variation-FILL-1' : ''}`}>notifications</span>
                            {/* Unread Badge */}
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1a160b]"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {isNotificationsOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsNotificationsOpen(false)}
                                ></div>
                                <div className="absolute right-0 top-12 w-[85vw] max-w-[320px] bg-white dark:bg-[#1a160b] rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                                        <button className="text-xs font-bold text-primary hover:text-primary-dark">Mark all read</button>
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        {notifications.map((notif) => (
                                            <div key={notif.id} className={`p-4 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''}`}>
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
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{notif.message}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">{notif.time}</p>
                                                    </div>
                                                    {!notif.read && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-white/5 text-center">
                                        <button
                                            onClick={() => {
                                                setIsNotificationsOpen(false);
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
                </div>
                {children}
            </main>

            <BottomNavbar />

            <QuickAddTransactionModal
                isOpen={isQuickAddOpen}
                onClose={closeQuickAdd}
                initialData={editingTransaction}
            />
        </div>
    );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => {
    return (
        <UIProvider>
            <DashboardContent {...props} />
        </UIProvider>
    );
};

export default DashboardLayout;
