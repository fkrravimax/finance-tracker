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
                fixed inset-y-0 left-0 z-30 w-72 bg-white/80 backdrop-blur-xl border border-white/50 dark:bg-background-dark dark:border-[#493f22] p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:m-4 md:rounded-3xl shadow-soft
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col gap-8 h-full">
                    {/* Brand */}
                    <div className="flex items-start justify-between px-2">
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-3">
                                    <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
                                </span>
                                FinTrack
                            </h1>
                            <p className="text-slate-400 dark:text-[#cbbc90] text-sm font-bold ml-12 -mt-1">Joyful Finance</p>
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
                                    : 'hover:bg-lavender-100 dark:hover:bg-[#2b2616] text-slate-500 hover:text-primary dark:text-[#cbbc90] hover:scale-[1.02] active:scale-95'}`}
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

                    {/* Pro Tip replaced with User Profile as per design */}
                    <div className="mt-auto">
                        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-lavender-100/50 dark:bg-white/5 border border-lavender-200 dark:border-[#493f22] hover:bg-lavender-200 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-full border-2 border-white dark:border-[#2b2616] shadow-sm overflow-hidden flex items-center justify-center bg-primary/20 text-primary">
                                <span className="material-symbols-outlined">person</span>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-800 dark:text-white truncate">User</p>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-mint-dark"></span>
                                    <p className="text-xs font-bold text-slate-500 dark:text-[#cbbc90]">Premium Plan</p>
                                </div>
                            </div>
                            <button
                                onClick={onLogout}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Logout"
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
