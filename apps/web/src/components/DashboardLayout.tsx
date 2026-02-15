import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNavbar from './BottomNavbar';
import LogoText from './LogoText';
import QuickAddTransactionModal from './QuickAddTransactionModal';
import { UIProvider, useUI } from '../contexts/UIContext';
import { useSwipeable, type SwipeEventData } from 'react-swipeable';
import NotificationBell from './NotificationBell';

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

                {/* Desktop Header */}
                <div className="hidden md:flex justify-end items-center px-6 py-4 sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <NotificationBell
                            notifications={notifications}
                            unreadCount={unreadCount}
                            isOpen={isNotificationsOpen}
                            onToggle={handleToggleNotifications}
                            onClose={() => setIsNotificationsOpen(false)}
                        />
                    </div>
                </div>

                {/* Mobile Header (Visible only on small screens) */}
                <div className="md:hidden flex items-center justify-between px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-slate-200 dark:border-white/5 bg-surface-light dark:bg-background-dark sticky top-0 z-50 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-slate-900 dark:bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-md shadow-slate-900/30 transform rotate-3">
                            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                        </span>
                        <LogoText className="text-xl" />
                    </div>

                    {/* Notification Button */}
                    <NotificationBell
                        notifications={notifications}
                        unreadCount={unreadCount}
                        isOpen={isNotificationsOpen}
                        onToggle={handleToggleNotifications}
                        onClose={() => setIsNotificationsOpen(false)}
                    />
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
