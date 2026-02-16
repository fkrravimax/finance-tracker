import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { authService } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import LogoText from './LogoText';
import ProfilePictureModal from './modals/ProfilePictureModal';

interface SidebarProps {
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isOpen = false, onClose }) => {
    // Local state to force re-render when user updates profile
    const [user, setUser] = useState(authService.getCurrentUser());
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Listen for user updates
    useEffect(() => {
        const handleUserUpdate = () => {
            setUser(authService.getCurrentUser());
        };

        window.addEventListener('user-updated', handleUserUpdate);
        return () => {
            window.removeEventListener('user-updated', handleUserUpdate);
        };
    }, []);

    const isAdmin = user?.role === 'ADMIN';
    const { t } = useLanguage();

    const mainNavItems = [
        { id: 'dashboard', label: t('sidebar.overview'), icon: 'grid_view' },
        { id: 'transactions', label: t('sidebar.transactions'), icon: 'list_alt' },
        { id: 'reports', label: t('sidebar.reports'), icon: 'pie_chart' },
        { id: 'trading', label: t('sidebar.trading'), icon: 'candlestick_chart' },
        { id: 'savings', label: t('sidebar.savings'), icon: 'savings' },
        { id: 'settings', label: t('sidebar.settings'), icon: 'settings' },
    ];

    if (isAdmin) {
        mainNavItems.push({ id: 'admin', label: t('sidebar.admin'), icon: 'admin_panel_settings' });
    }

    return (
        <>
            <ProfilePictureModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                currentUser={user}
            />

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border border-white/50 dark:bg-background-dark dark:border-white/5 pt-6 px-6 pb-6 md:p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:m-4 md:rounded-3xl shadow-soft
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col gap-8 h-full pt-28 md:pt-0">
                    {/* Brand */}
                    <div className="hidden md:flex items-start justify-between px-2">
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/30 rotate-3">
                                    <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                                </span>
                                <LogoText className="text-3xl" />
                            </h1>
                            <p className="text-slate-400 dark:text-text-muted text-sm font-bold ml-12 -mt-1">Joyful Finance Tracker</p>
                        </div>
                        {/* Mobile Close Button */}
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:text-text-muted dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-3">
                        {mainNavItems.map((item) => (
                            <NavLink
                                key={item.id}
                                to={`/${item.id}`}
                                onClick={() => {
                                    if (window.innerWidth < 768 && onClose) {
                                        onClose();
                                    }
                                }}
                                className={({ isActive }) => `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all w-full text-left font-bold ${isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]'
                                    : 'hover:bg-lavender-100 dark:hover:bg-lavender-100 text-slate-500 hover:text-primary dark:text-text-muted dark:hover:text-primary hover:scale-[1.02] active:scale-95'}`}
                            >
                                {() => (
                                    <>
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                        <span className="text-base">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User Profile */}
                    <div className="mt-auto hidden md:block">
                        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-lavender-100/50 dark:bg-white/5 border border-lavender-200 dark:border-white/5 hover:bg-lavender-200 dark:hover:bg-white/10 transition-colors group relative">
                            <div
                                className="relative w-12 h-12 rounded-full border-2 border-white dark:border-white/10 shadow-sm overflow-hidden flex items-center justify-center bg-primary/20 text-primary cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsProfileModalOpen(true);
                                }}
                            >
                                {user?.image ? (
                                    <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined">person</span>
                                )}
                                {/* Pencil Overlay */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white text-sm">edit</span>
                                </div>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-800 dark:text-white truncate">{user?.name || 'User'}</p>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-mint-dark"></span>
                                    <p className="text-xs font-bold text-slate-500 dark:text-text-muted">{user?.plan ? `${user.plan}` : t('sidebar.freePlan')}</p>
                                </div>
                            </div>
                            <button
                                onClick={onLogout}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title={t('sidebar.logout')}
                            >
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
