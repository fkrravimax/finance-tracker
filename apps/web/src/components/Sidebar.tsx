import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isOpen = false, onClose }) => {
    const mainNavItems = [
        { id: 'dashboard', label: 'Overview', icon: 'grid_view' },
        { id: 'transactions', label: 'Transactions', icon: 'list_alt' },
        { id: 'reports', label: 'Reports', icon: 'pie_chart' },
        { id: 'savings', label: 'Savings Vault', icon: 'savings' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ];

    return (
        <>
            <aside className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-surface-light dark:bg-background-dark border-r border-slate-200 dark:border-[#493f22] p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col gap-6 h-full">
                    {/* Brand */}
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                                FinTrack
                            </h1>
                            <p className="text-slate-500 dark:text-[#cbbc90] text-sm font-medium">Pro Plan</p>
                        </div>
                        {/* Mobile Close Button */}
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:text-[#cbbc90] dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2">
                        {mainNavItems.map((item) => (
                            <NavLink
                                key={item.id}
                                to={`/${item.id}`}
                                onClick={() => {
                                    if (window.innerWidth < 768 && onClose) {
                                        onClose();
                                    }
                                }}
                                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${isActive ? 'bg-primary/10 dark:bg-[#493f22] text-primary dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-[#2b2616] text-slate-600 dark:text-[#cbbc90]'}`}
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                                        <span className="text-sm font-semibold">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Pro Tip */}
                    <div className="mt-auto">
                        <div className="p-4 rounded-xl bg-slate-900 dark:bg-gradient-to-br dark:from-[#493f22] dark:to-[#2f2a1a] border border-slate-800 dark:border-[#5a5030] text-white">
                            <div className="flex items-center gap-2 mb-2 text-primary">
                                <span className="material-symbols-outlined text-xl">tips_and_updates</span>
                                <span className="text-sm font-bold">Pro Tip</span>
                            </div>
                            <p className="text-xs text-slate-300 dark:text-[#cbbc90] leading-relaxed">
                                Automating your savings can increase consistency by 40%.
                            </p>
                        </div>
                    </div>
                </div>
                {/* Logout */}
                <div className="mt-4">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2b2616] text-slate-600 dark:text-[#cbbc90] transition-colors w-full text-left"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="text-sm font-medium">Log out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
