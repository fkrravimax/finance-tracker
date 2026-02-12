import React, { useState, useMemo } from 'react';
import { useAppearance } from '../contexts/AppearanceContext';
import { useLanguage } from '../contexts/LanguageContext';
import HiddenAmount from './HiddenAmount';
import type { Transaction } from '../types';

interface CashFlowChartProps {
    income: number;
    expense: number;
    transactions: Transaction[];
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ income, expense, transactions = [] }) => {
    const { t } = useLanguage();
    const { privacyMode } = useAppearance();
    const [viewMode, setViewMode] = useState<'chart' | 'calendar'>('chart');

    // ... (inside map)

    const [currentDate, setCurrentDate] = useState(new Date());

    // Chart Logic
    const netFlow = income - expense;
    const maxVal = Math.max(income, expense, 1);
    const incomeWidth = Math.min((income / maxVal) * 100, 100);
    const expenseWidth = Math.min((expense / maxVal) * 100, 100);

    // Calendar Logic
    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month + 1, 0).getDate();
    }, [currentDate]);

    const firstDayOfMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month, 1).getDay();
    }, [currentDate]);

    const dailyStats = useMemo(() => {
        const stats: Record<number, { income: number; expense: number; net: number }> = {};
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate.getFullYear() === year && tDate.getMonth() === month) {
                const day = tDate.getDate();
                if (!stats[day]) stats[day] = { income: 0, expense: 0, net: 0 };

                if (t.type === 'income') {
                    stats[day].income += Number(t.amount);
                } else {
                    stats[day].expense += Number(t.amount);
                }
            }
        });

        // Calculate Net
        Object.keys(stats).forEach(day => {
            const d = Number(day);
            stats[d].net = stats[d].income - stats[d].expense;
        });

        return stats;
    }, [transactions, currentDate]);

    const formatCompact = (amount: number) => {
        if (amount >= 1000000) {
            return `${+(amount / 1000000).toFixed(1)}jt`;
        }
        if (amount >= 1000) {
            return `${+(amount / 1000).toFixed(0)}rb`;
        }
        return amount.toString();
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    return (
        <div className="xl:col-span-2 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-[#493f22] shadow-sm p-6 flex flex-col relative overflow-hidden">
            {/* Header / Toggle */}
            <div className="flex items-center justify-between mb-6 z-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {t('dashboard.cashFlow')}
                        <button
                            onClick={() => setViewMode(viewMode === 'chart' ? 'calendar' : 'chart')}
                            className="bg-slate-100 dark:bg-[#3f361d] text-slate-600 dark:text-[#cbbc90] p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-[#493f22] transition-colors"
                            title="Toggle View"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {viewMode === 'chart' ? 'calendar_month' : 'bar_chart'}
                            </span>
                        </button>
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-[#cbbc90]">
                        {viewMode === 'chart' ? t('dashboard.incomeVsExpense') : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {viewMode === 'calendar' ? (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#3f361d] rounded-lg p-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-[#493f22] rounded-md transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-slate-600 dark:text-[#cbbc90]">chevron_left</span>
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-[#493f22] rounded-md transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-slate-600 dark:text-[#cbbc90]">chevron_right</span>
                        </button>
                    </div>
                ) : (
                    <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider font-bold">{t('dashboard.netFlow')}</p>
                        <p className={`text-xl font-bold ${netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            {netFlow >= 0 ? '+' : '-'}
                            <HiddenAmount value={Math.abs(netFlow)} prefix="Rp " isImportant />
                        </p>
                    </div>
                )}
            </div>

            {/* Content */}
            {viewMode === 'chart' ? (
                <>
                    <div className="flex-1 flex flex-col justify-center gap-8 py-4">
                        {/* Income Bar */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-slate-600 dark:text-[#cbbc90]">{t('dashboard.income')}</span>
                                <span className="text-slate-900 dark:text-white">
                                    <HiddenAmount value={income} prefix="Rp " isImportant />
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-[#493f22] rounded-full h-4 relative">
                                <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full" style={{ width: `${incomeWidth}%` }}></div>
                            </div>
                        </div>
                        {/* Expenses Bar */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-slate-600 dark:text-[#cbbc90]">{t('dashboard.expense')}</span>
                                <span className="text-slate-900 dark:text-white">
                                    <HiddenAmount value={expense} prefix="Rp " isImportant />
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-[#493f22] rounded-full h-4 relative">
                                <div className="absolute top-0 left-0 h-full bg-red-500 rounded-full" style={{ width: `${expenseWidth}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#493f22] grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-slate-400 dark:text-[#cbbc90]/60 mb-1">{t('dashboard.savingsRate')}</p>
                            <p className="font-bold text-slate-800 dark:text-white">{income > 0 ? Math.round(((income - expense) / income) * 100) : 0}%</p>
                        </div>
                    </div>
                </>
            ) : (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-xs font-bold text-slate-400 dark:text-[#cbbc90]/60">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-14 md:h-16 rounded-xl bg-transparent"></div>
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const stat = dailyStats[day];
                            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

                            return (
                                <div key={day} className={`h-14 md:h-16 rounded-xl flex flex-col items-center justify-center border transition-colors ${isToday ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-[#2b2616] border-slate-100 dark:border-[#3f361d] text-slate-600 dark:text-[#cbbc90]'}`}>
                                    <span className={`text-xs font-bold mb-1 ${isToday ? 'text-primary' : 'text-slate-500'}`}>{day}</span>
                                    {stat && (
                                        <span className={`text-[10px] md:text-xs font-extrabold ${stat.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {privacyMode === 'extreme' ? '•••••' : formatCompact(Math.abs(stat.net))}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex justify-between text-xs font-bold text-slate-500 dark:text-[#cbbc90] px-2">
                        {/* Optional summary footer if needed */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashFlowChart;
