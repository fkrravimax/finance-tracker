import React, { useState, useEffect } from 'react';
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
        return <div className="flex items-center justify-center min-h-[50vh]">Loading dashboard...</div>;
    }

    const trend = stats && stats.totalBalance > 0
        ? ((stats.income - stats.expense) / stats.totalBalance) * 100
        : 0;

    return (
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12 flex flex-col gap-8">
            <QuickAddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTransactionAdded={handleTransactionAdded}
            />

            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={() => setIsOnboardingOpen(false)}
                onComplete={() => {
                    // Re-fetch stats, which might trigger the next modal (Balance)
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

            {/* Page Heading */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h2>
                    <p className="text-slate-500 dark:text-[#cbbc90] text-base font-normal">Welcome back, {user?.name || 'User'}! Here's your financial summary.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-3 md:py-2 bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-[#36301d] transition-colors text-slate-900 dark:text-white"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Export
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-3 md:py-2 bg-primary text-slate-900 rounded-lg text-sm font-bold shadow-md hover:bg-[#e0b020] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        New Transaction
                    </button>
                </div>
            </header>

            {/* Top Row: Stats & Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total Balance Card */}
                <div className="flex flex-col justify-between rounded-2xl p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-[#493f22] shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-primary/10 dark:bg-[#493f22] text-primary dark:text-[#f4c025]">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                        </div>
                        {/* Dynamic Trend */}
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${trend >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                            <span className="material-symbols-outlined text-[16px]">{trend >= 0 ? 'trending_up' : 'trending_down'}</span>
                            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-[#cbbc90] text-sm font-medium mb-1">Total Balance</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                <HiddenAmount value={stats?.totalBalance || 0} prefix="Rp " isImportant className="" />
                            </p>
                            {stats?.totalBalance === 0 && (
                                <button
                                    onClick={() => setIsBalanceModalOpen(true)}
                                    className="text-xs bg-primary text-slate-900 px-2 py-1 rounded-md font-bold hover:bg-[#dca60e]"
                                >
                                    + Add Balance
                                </button>
                            )}
                        </div>
                        <p className="text-slate-400 dark:text-[#cbbc90]/70 text-xs mt-2">Net Worth</p>
                    </div>
                </div>

                {/* Budget Progress Card */}
                <div className="flex flex-col justify-center rounded-2xl p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-[#493f22] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-900 dark:text-white text-lg font-bold">Monthly Budget</p>
                        <button
                            onClick={() => setIsBudgetModalOpen(true)}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-[#493f22] hover:bg-slate-200 dark:hover:bg-[#5a4e2b] transition-colors"
                            title="View Budget Breakdown"
                        >
                            <span className="material-symbols-outlined text-slate-500 dark:text-[#cbbc90]">pie_chart</span>
                        </button>
                    </div>
                    {stats?.budget ? (
                        <>
                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.budget.percentage}%</span>
                                <span className="text-sm text-slate-500 dark:text-[#cbbc90] mb-1">
                                    used of <HiddenAmount value={stats.budget.limit} prefix="Rp " /> limit
                                </span>
                            </div>
                            <div className="relative w-full h-3 bg-slate-100 dark:bg-[#493f22] rounded-full overflow-hidden mb-3">
                                <div
                                    className={`absolute top-0 left-0 h-full rounded-full ${stats.budget.percentage > 90 ? 'bg-red-500' : 'bg-primary'}`}
                                    style={{ width: `${stats.budget.percentage}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-2 text-amber-600 dark:text-[#f4c025] max-w-[60%]">
                                    {stats.budget.percentage > 80 && (
                                        <>
                                            <span className="material-symbols-outlined text-[18px] mt-0.5">warning</span>
                                            <p className="text-sm font-medium leading-tight">You've used {stats.budget.percentage}% of your budget.</p>
                                        </>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 dark:text-[#cbbc90]/70 font-medium">
                                        {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-[#cbbc90]">
                                        {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()} days left
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                            <p className="text-slate-500 mb-2">No budget set</p>
                            <button
                                onClick={() => setIsOnboardingOpen(true)}
                                className="text-primary font-bold hover:underline"
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
            <div className="pb-8 text-center text-xs text-slate-400 dark:text-[#cbbc90]/40">
                © 2026 FinTrack by @Fkrravi. Secure & Encrypted.
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
