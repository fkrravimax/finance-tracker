import React, { useState, useEffect } from 'react';
import DashboardSkeleton from './skeletons/DashboardSkeleton';
import CashFlowChart from './CashFlowChart';
import TransactionList from './TransactionList';
import HiddenAmount from './HiddenAmount';
import QuickAddTransactionModal from './QuickAddTransactionModal';
import OnboardingModal from './OnboardingModal';
import InitialBalanceModal from './InitialBalanceModal';
import ExportModal from './ExportModal';
import BudgetBreakdownModal from './BudgetBreakdownModal';
import { dashboardService, type DashboardStats } from '../services/dashboardService';
import { authService } from '../services/authService';

const Dashboard: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

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

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        fetchStats();
    }, []);

    const handleTransactionAdded = () => {
        fetchStats(); // Refresh stats when transaction is added
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    const trend = stats && stats.totalBalance > 0
        ? ((stats.income - stats.expense) / stats.totalBalance) * 100
        : 0;

    return (

        <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-8">
            <QuickAddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTransactionAdded={handleTransactionAdded}
            />

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

            {/* Page Heading - Glassmorphism */}
            <header className="flex flex-wrap justify-between items-end gap-6 bg-white/60 dark:bg-white/5 p-6 rounded-bubbly shadow-sm backdrop-blur-sm border border-white/60 dark:border-white/5">
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-800 dark:text-white">
                        Dashboard <span className="text-primary">Overview</span>
                    </h2>
                    <p className="text-slate-500 dark:text-[#cbbc90] text-lg font-bold flex items-center gap-2">
                        Welcome back, {user?.name || 'User'}! ✨ Here's your summary.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/10 text-slate-600 dark:text-white border-2 border-lavender-200 dark:border-white/20 rounded-2xl text-sm font-bold hover:bg-lavender-50 dark:hover:bg-white/20 hover:border-lavender-300 transition-all hover:-translate-y-1 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[22px]">download</span>
                        Export
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 dark:bg-primary text-white dark:text-slate-900 rounded-2xl text-sm font-bold shadow-lg shadow-slate-300 dark:shadow-primary/30 hover:bg-slate-900 dark:hover:bg-primary-hover transition-all hover:-translate-y-1"
                    >
                        <span className="material-symbols-outlined text-[22px]">add_circle</span>
                        Add New
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
                        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/20">
                            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-extrabold shadow-sm ${trend >= 0 ? 'bg-white text-sky-dark' : 'bg-red-100 text-red-600'}`}>
                            <span className="material-symbols-outlined text-[18px]">{trend >= 0 ? 'trending_up' : 'trending_down'}</span>
                            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                    </div>

                    <div className="relative z-10">
                        <p className="text-sky-100 text-base font-bold mb-2">Total Balance</p>
                        <div className="flex items-baseline gap-2 overflow-hidden">
                            <p className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-sm whitespace-nowrap truncate">
                                <HiddenAmount value={stats?.totalBalance || 0} prefix="Rp " isImportant className="" />
                            </p>
                        </div>
                        {stats?.totalBalance === 0 && (
                            <button
                                onClick={() => setIsBalanceModalOpen(true)}
                                className="mt-4 text-xs bg-white text-sky-dark px-3 py-1.5 rounded-full font-bold hover:bg-sky-50 transition-colors"
                            >
                                + Add Initial Balance
                            </button>
                        )}
                        <p className="text-sky-100 text-sm mt-3 font-semibold bg-white/10 inline-block px-3 py-1 rounded-full">Updated just now</p>
                    </div>
                </div>

                {/* Budget Progress Card - Peach Style */}
                <div className="flex flex-col justify-center rounded-bubbly p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-card relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-peach/10 rounded-bl-full -mr-4 -mt-4"></div>

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <p className="text-slate-800 dark:text-white text-xl font-extrabold">Monthly Budget</p>
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
                                    used of <HiddenAmount value={stats.budget.limit} prefix="Rp " />
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
                                        ? "Whoa! You've almost hit your limit. Time to slow down! 🛑"
                                        : stats.budget.percentage > 65
                                            ? "You've used over 65%. Maybe cook dinner tonight? 🍳"
                                            : "You're doing great! Keep it up. 🌟"}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-slate-500 mb-4 font-bold">No budget set for this month</p>
                            <button
                                onClick={() => setIsOnboardingOpen(true)}
                                className="px-6 py-2 bg-peach text-white font-bold rounded-xl shadow-lg shadow-peach/30 hover:bg-peach-dark transition-all"
                            >
                                Set Budget
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Row: Charts & Lists */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <CashFlowChart income={stats?.income || 0} expense={stats?.expense || 0} />
                <TransactionList limit={4} />
            </div>

            {/* Bottom decorative element */}
            <div className="pb-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                <span>© 2026 FinTrack.</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>Created <span className="text-red-400">By</span> @fkrravi</span>
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
