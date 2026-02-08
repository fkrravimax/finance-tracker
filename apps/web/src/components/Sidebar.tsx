import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { authService } from '../services/authService';
import { useMultiAccount } from '../contexts/MultiAccountContext';

interface SidebarProps {
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isOpen = false, onClose }) => {
    const user = authService.getCurrentUser();
    const isAdmin = user?.role === 'ADMIN';
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const { startAddAccount } = useMultiAccount();

    const mainNavItems = [
        { id: 'dashboard', label: 'Overview', icon: 'grid_view' },
        { id: 'transactions', label: 'Transactions', icon: 'list_alt' },
        { id: 'reports', label: 'Reports', icon: 'pie_chart' },
        { id: 'trading', label: 'Trading Terminal', icon: 'candlestick_chart' },
        { id: 'savings', label: 'Savings Vault', icon: 'savings' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ];

    if (isAdmin) {
        mainNavItems.push({ id: 'admin', label: 'Admin Dashboard', icon: 'admin_panel_settings' });
    }

    return (
        <>
            <aside className={`
                fixed inset-y-0 left-0 z-30 w-72 bg-white/80 backdrop-blur-xl border border-white/50 dark:bg-background-dark dark:border-white/5 pt-24 px-6 pb-6 md:p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:m-4 md:rounded-3xl shadow-soft
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col gap-8 h-full">
                    {/* Brand */}
                    <div className="hidden md:flex items-start justify-between px-2">
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-3">
                                    <img src="/icon-512.png" alt="Logo" className="w-6 h-6 object-contain" />
                                </span>
                                FinTrack
                            </h1>
                            <p className="text-slate-400 dark:text-text-muted text-sm font-bold ml-12 -mt-1">Joyful Finance</p>
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

                    {/* User Profile & Account Switcher */}
                    <div className="mt-auto relative">
                        {isAccountMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40 bg-transparent"
                                    onClick={() => setIsAccountMenuOpen(false)}
                                />
                                <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-[#2a2515] rounded-2xl shadow-xl border border-slate-100 dark:border-[#493f22] p-2 z-50 flex flex-col gap-1 animate-scale-in origin-bottom">
                                    <div className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Switch Account</div>

                                    {authService.getAccounts().map(account => {
                                        const isActive = account.id === user?.id;
                                        return (
                                            <button
                                                key={account.id}
                                                onClick={() => {
                                                    if (!isActive) {
                                                        authService.switchAccount(account.id);
                                                        setIsAccountMenuOpen(false);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors w-full
                                                    ${isActive
                                                        ? 'bg-primary/10 text-primary dark:text-primary'
                                                        : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                                                    }
                                                `}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isActive ? 'bg-primary text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                                    {account.name?.charAt(0) || account.email?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="text-sm font-bold truncate">{account.name || 'Unnamed'}</span>
                                                    <span className="text-xs opacity-70 truncate">{account.email}</span>
                                                </div>
                                                {isActive && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                                            </button>
                                        );
                                    })}

                                    <div className="h-px bg-slate-100 dark:bg-[#493f22] my-1" />

                                    <button
                                        onClick={() => {
                                            startAddAccount();
                                            setIsAccountMenuOpen(false);
                                        }}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors w-full"
                                    >
                                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                        </div>
                                        <span className="text-sm font-bold">Add Account</span>
                                    </button>

                                    <div className="h-px bg-slate-100 dark:bg-[#493f22] my-1" />

                                    <button
                                        onClick={onLogout}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors w-full"
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                                            <span className="material-symbols-outlined text-[18px]">logout</span>
                                        </div>
                                        <span className="text-sm font-bold">Log Out</span>
                                    </button>
                                </div>
                            </>
                        )}

                        <div
                            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-2xl bg-lavender-100/50 dark:bg-white/5 border border-lavender-200 dark:border-white/5 hover:bg-lavender-200 dark:hover:bg-white/10 transition-colors cursor-pointer group select-none ${isAccountMenuOpen ? 'ring-2 ring-primary border-transparent' : ''}`}
                        >
                            <div className="w-12 h-12 rounded-full border-2 border-white dark:border-white/10 shadow-sm overflow-hidden flex items-center justify-center bg-primary/20 text-primary">
                                <span className="material-symbols-outlined">person</span>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-800 dark:text-white truncate">{user?.name || 'User'}</p>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-mint-dark"></span>
                                    <p className="text-xs font-bold text-slate-500 dark:text-text-muted">{user?.plan ? `${user.plan} Plan` : 'Free Plan'}</p>
                                </div>
                            </div>
                            <span className={`material-symbols-outlined text-slate-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`}>expand_less</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
