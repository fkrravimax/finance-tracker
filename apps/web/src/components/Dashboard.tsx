
import React, { useState, useEffect } from 'react';
import DashboardSkeleton from './skeletons/DashboardSkeleton';
import CashFlowChart from './CashFlowChart';

import TransactionList from './TransactionList';
import HiddenAmount from './HiddenAmount';
// QuickAddTransactionModal removed (global)
import OnboardingModal from './OnboardingModal';
import InitialBalanceModal from './InitialBalanceModal';
import ExportModal from './ExportModal';
import BudgetBreakdownModal from './BudgetBreakdownModal';
import WalletListModal from './WalletListModal';
import { dashboardService, type DashboardStats } from '../services/dashboardService';
import { authService } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import { useUI } from '../contexts/UIContext';
import { useAppearance } from '../contexts/AppearanceContext';
import api from '../services/api';

import { transactionService } from '../services/transactionService';

const Dashboard: React.FC = () => {
    const { openQuickAdd } = useUI();
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);

    const [user, setUser] = useState<any>(null);
    const { t } = useLanguage();

    const fetchStats = async () => {
        try {
            const data = await dashboardService.getStats();
            setStats(data);

            // Onboarding Logic Sequence:
            // 1. If no budget set -> Show Budget Modal
            // 2. If budget set BUT total balance is 0 and income is 0 (new account) -> Show Balance Modal
            if (!data.budget) {
                setIsOnboardingOpen(true);
            } else if (data.totalBalance === 0 && data.income === 0) {
                setIsBalanceModalOpen(true);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const data = await transactionService.getAll();
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        }
    };

    const handleAddWallet = async (name: string, type: string) => {
        try {
            await api.post('/wallets', { name, type });
            fetchStats(); // Refresh to show new wallet
        } catch (error) {
            console.error("Failed to add wallet", error);
        }
    };

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        fetchStats();
        fetchTransactions();

        // Listen for global transaction updates
        const handleTransactionUpdate = () => {
            fetchStats();
            fetchTransactions();
        };
        window.addEventListener('transaction-updated', handleTransactionUpdate);

        return () => {
            window.removeEventListener('transaction-updated', handleTransactionUpdate);
        };
    }, []);

    const { privacyMode, setPrivacyMode } = useAppearance();

    const togglePrivacy = () => {
        if (privacyMode === 'none') {
            setPrivacyMode('hidden');
        } else {
            setPrivacyMode('none');
        }
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    const trend = stats && stats.income > 0
        ? ((stats.totalBalance - stats.income) / stats.income) * 100
        : 0;

    // Date Logic
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - currentDay;
    const formattedDate = today.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    return (

        <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-8">
            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={() => setIsOnboardingOpen(false)}
                onComplete={() => {
                    fetchStats();
                }}
            />

            <InitialBalanceModal
                isOpen={isBalanceModalOpen}
                onClose={() => setIsBalanceModalOpen(false)}
                onComplete={fetchStats}
            />

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />

            <WalletListModal
                isOpen={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                wallets={stats?.wallets || []}
                onAddWallet={handleAddWallet}
            />

            {/* Page Heading - Glassmorphism */}
            <header className="flex flex-wrap justify-between items-center md:items-end gap-4 md:gap-6 bg-transparent md:bg-white/60 dark:bg-transparent md:dark:bg-white/5 p-0 md:p-6 rounded-none md:rounded-bubbly shadow-none md:shadow-sm backdrop-blur-none md:backdrop-blur-sm border-none md:border md:border-white/60 md:dark:border-white/5">
                <div className="flex flex-col gap-2">
                    <h2 className="hidden md:block text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-800 dark:text-white">
                        {t('dashboard.overview')} <span className="text-primary">{t('dashboard.overviewSuffix')}</span>
                    </h2>
                    <p className="text-slate-500 dark:text-[#cbbc90] text-lg font-bold flex items-center gap-2">
                        {t('dashboard.greeting').replace('{name}', '')}
                        <span className={`
                            ${user?.plan === 'PREMIUM' ? 'text-gold' : ''}
                            ${user?.plan === 'PLATINUM' ? 'text-platinum text-xl' : ''}
                            ${!user?.plan || user?.plan === 'FREE' ? 'text-slate-900 dark:text-white' : ''}
                        `}>
                            {user?.name || 'User'}
                        </span>
                        {user?.plan === 'PLATINUM' && <span className="text-xl animate-pulse">✨</span>}
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 md:px-6 md:py-3 bg-white dark:bg-white/10 text-slate-600 dark:text-white border md:border-2 border-lavender-200 dark:border-white/20 rounded-xl md:rounded-2xl text-sm font-bold hover:bg-lavender-50 dark:hover:bg-white/20 hover:border-lavender-300 transition-all hover:-translate-y-1 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px] md:text-[22px]">download</span>
                        <span className="hidden md:inline">{t('dashboard.export')}</span>
                    </button>
                    <button
                        onClick={() => openQuickAdd()}
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-slate-800 dark:bg-primary text-white dark:text-slate-900 rounded-2xl text-sm font-bold shadow-lg shadow-slate-300 dark:shadow-primary/30 hover:bg-slate-900 dark:hover:bg-primary-hover transition-all hover:-translate-y-1"
                    >
                        <span className="material-symbols-outlined text-[22px]">add_circle</span>
                        {t('dashboard.addNew')}
                    </button>
                </div>
            </header>

            {/* Top Row: Stats & Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total Balance Card - Sky Blue Style */}
                <div className="flex flex-col justify-between rounded-bubbly p-8 bg-sky-dark dark:bg-sky-900/50 text-white shadow-lg shadow-sky-200 dark:shadow-none relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky/30 rounded-full blur-2xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-sky/20 rounded-full blur-xl"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div
                            onClick={() => setIsWalletModalOpen(true)}
                            className="p-4 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/20 cursor-pointer hover:bg-white/30 transition-colors"
                        >
                            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-extrabold shadow-sm ${trend >= 0 ? 'bg-white text-sky-dark' : 'bg-red-100 text-red-600'}`}>
                            <span className="material-symbols-outlined text-[18px]">{trend >= 0 ? 'trending_up' : 'trending_down'}</span>
                            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                    </div>

                    <div className="relative z-10">
                        <p className="text-sky-100 text-base font-bold mb-2">{t('dashboard.totalBalance')}</p>
                        <div className="flex items-center gap-4 overflow-hidden">
                            <p className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm whitespace-nowrap truncate">
                                <HiddenAmount value={stats?.totalBalance || 0} prefix="Rp " isImportant className="" />
                            </p>
                            <button
                                onClick={togglePrivacy}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                                title={privacyMode === 'none' ? "Hide balance" : "Show balance"}
                            >
                                <span className="material-symbols-outlined text-white">
                                    {privacyMode === 'none' ? 'visibility' : 'visibility_off'}
                                </span>
                            </button>
                        </div>
                        {stats?.totalBalance === 0 && (
                            <button
                                onClick={() => setIsBalanceModalOpen(true)}
                                className="mt-4 text-xs bg-white text-sky-dark px-3 py-1.5 rounded-full font-bold hover:bg-sky-50 transition-colors"
                            >
                                + {t('dashboard.buttons.addBalance')}
                            </button>
                        )}
                        <p className="text-sky-100 text-sm mt-3 font-semibold bg-white/10 inline-block px-3 py-1 rounded-full">{t('dashboard.updatedJustNow')}</p>
                    </div>
                </div>

                {/* Budget Progress Card - Peach Style */}
                <div className="flex flex-col justify-center rounded-bubbly p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-card relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-peach/10 rounded-bl-full -mr-4 -mt-4"></div>

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div>
                            <p className="text-slate-800 dark:text-white text-xl font-extrabold">{t('dashboard.monthlyBudget')}</p>
                            <p className="text-xs font-bold text-slate-500 dark:text-[#cbbc90] mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                {formattedDate} • {t('dashboard.daysLeft').replace('{days}', daysRemaining.toString())}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsBudgetModalOpen(true)}
                            className="p-3 rounded-2xl bg-peach/20 text-peach-dark hover:bg-peach/30 transition-colors"
                        >
                            <span className="material-symbols-outlined">donut_large</span>
                        </button>
                    </div>

                    {stats?.budget ? (
                        <>
                            <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-3 mb-6 relative z-10">
                                <span className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white">{stats.budget.percentage}%</span>
                                <span className="text-sm md:text-base text-slate-500 dark:text-[#cbbc90] font-bold mb-2">
                                    {t('dashboard.usedOf')} <HiddenAmount value={stats.budget.limit} prefix="Rp " />
                                </span>
                            </div>

                            <div className="relative w-full h-6 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-5 border border-slate-100 dark:border-white/5">
                                <div
                                    className={`absolute top-0 left-0 h-full rounded-full shadow-sm ${stats.budget.percentage > 90 ? 'bg-red-500' : 'bg-peach'}`}
                                    style={{ width: `${Math.min(stats.budget.percentage, 100)}%` }}
                                >
                                    <div className="absolute top-0 right-0 bottom-0 w-full bg-white/20 animate-pulse"></div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-peach/10 dark:bg-peach/5 text-peach-dark dark:text-peach relative z-10">
                                <span className="material-symbols-outlined text-[20px] mt-0.5">info</span>
                                <p className="text-sm font-bold leading-tight">
                                    {stats.budget.percentage > 90
                                        ? t('dashboard.budgetWarnings.critical')
                                        : stats.budget.percentage > 65
                                            ? t('dashboard.budgetWarnings.warning')
                                            : t('dashboard.budgetWarnings.good')}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-slate-500 mb-4 font-bold">{t('dashboard.noBudget')}</p>
                            <button
                                onClick={() => setIsOnboardingOpen(true)}
                                className="px-6 py-2 bg-peach text-white font-bold rounded-xl shadow-lg shadow-peach/30 hover:bg-peach-dark transition-all"
                            >
                                {t('dashboard.buttons.setBudget')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Row: Charts & Lists */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <CashFlowChart income={stats?.income || 0} expense={stats?.expense || 0} transactions={transactions} />
                <TransactionList limit={4} />
            </div>



            {/* Bottom decorative element */}
            <div className="pb-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                <span>© 2026 Rupiku.</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>Created by <span className="text-red-400">@fkrravi</span></span>
            </div>

            {/* Budget Breakdown Modal */}
            <BudgetBreakdownModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
