import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';
import { useLanguage } from '../contexts/LanguageContext';

const BottomNavbar: React.FC = () => {
    const { openQuickAdd } = useUI();
    const { t } = useLanguage();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
        setIsMenuOpen(!isMenuOpen);
    };

    const handleQuickAdd = () => {
        setIsMenuOpen(false);
        openQuickAdd();
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <>
            {/* Overlay for menu */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Floating Menu Items */}
            <div className={`fixed bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50 transition-all duration-300 md:hidden ${isMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>

                {/* Option 3: Savings */}
                <NavLink
                    to="/savings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-4 bg-white dark:bg-[#2b2616] pl-4 pr-6 py-4 w-64 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 active:scale-95 transition-transform"
                >
                    <div className="w-10 h-10 rounded-full bg-peach/20 text-peach-dark flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">savings</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white text-base">Savings Vault</span>
                </NavLink>

                {/* Option 2: Trading */}
                <NavLink
                    to="/trading"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-4 bg-white dark:bg-[#2b2616] pl-4 pr-6 py-4 w-64 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 active:scale-95 transition-transform"
                >
                    <div className="w-10 h-10 rounded-full bg-sky/20 text-sky-dark flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">candlestick_chart</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white text-base">Trading Terminal</span>
                </NavLink>

                {/* Option 1: Add Transaction */}
                <button
                    onClick={handleQuickAdd}
                    className="flex items-center gap-4 bg-white dark:bg-[#2b2616] pl-4 pr-6 py-4 w-64 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 active:scale-95 transition-transform text-left"
                >
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">receipt_long</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white text-base">Add Transaction</span>
                </button>
            </div>

            {/* Bottom Navbar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#1a160b]/80 backdrop-blur-xl border-t border-white/50 dark:border-white/5 pb-[env(safe-area-inset-bottom)] pt-2 px-6 z-50 md:hidden shadow-lg shadow-black/5">
                <div className="flex items-center justify-between h-16">
                    {/* Home */}
                    <NavLink
                        to="/dashboard"
                        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/dashboard') ? 'text-primary' : 'text-slate-400 dark:text-[#685a31]'}`}
                    >
                        <span className={`material-symbols-outlined text-[26px] ${isActive('/dashboard') ? 'font-variation-FILL-1' : ''}`}>grid_view</span>
                        <span className="text-[10px] font-bold">{t('sidebar.overview')}</span>
                    </NavLink>

                    {/* Transactions */}
                    <NavLink
                        to="/transactions"
                        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/transactions') ? 'text-primary' : 'text-slate-400 dark:text-[#685a31]'}`}
                    >
                        <span className={`material-symbols-outlined text-[26px] ${isActive('/transactions') ? 'font-variation-FILL-1' : ''}`}>list_alt</span>
                        <span className="text-[10px] font-bold">{t('sidebar.transactions')}</span>
                    </NavLink>

                    {/* FAB Placeholder */}
                    <div className="w-12"></div>

                    {/* FAB Button */}
                    <button
                        onClick={toggleMenu}
                        className={`absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 bg-primary text-black rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transition-transform duration-300 ${isMenuOpen ? 'rotate-45 bg-slate-800 text-white dark:bg-white dark:text-black' : 'hover:scale-105 active:scale-95'}`}
                    >
                        <span className="material-symbols-outlined text-[32px]">add</span>
                    </button>

                    {/* Reports */}
                    <NavLink
                        to="/reports"
                        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/reports') ? 'text-primary' : 'text-slate-400 dark:text-[#685a31]'}`}
                    >
                        <span className={`material-symbols-outlined text-[26px] ${isActive('/reports') ? 'font-variation-FILL-1' : ''}`}>pie_chart</span>
                        <span className="text-[10px] font-bold">{t('sidebar.reports')}</span>
                    </NavLink>

                    {/* Settings */}
                    <NavLink
                        to="/settings"
                        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/settings') ? 'text-primary' : 'text-slate-400 dark:text-[#685a31]'}`}
                    >
                        <span className={`material-symbols-outlined text-[26px] ${isActive('/settings') ? 'font-variation-FILL-1' : ''}`}>settings</span>
                        <span className="text-[10px] font-bold">{t('sidebar.settings')}</span>
                    </NavLink>
                </div>
            </nav>
        </>
    );
};

export default BottomNavbar;
