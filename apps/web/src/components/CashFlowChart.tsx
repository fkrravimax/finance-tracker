import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const selectedTransactions = useMemo(() => {
        if (!selectedDay) return [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && tDate.getMonth() === month && tDate.getDate() === selectedDay;
        });
    }, [selectedDay, currentDate, transactions]);

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
                                <div
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`cursor-pointer h-14 md:h-16 rounded-xl flex flex-col items-center justify-center border transition-all hover:scale-105 active:scale-95 hover:shadow-sm ${isToday ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-[#2b2616] border-slate-100 dark:border-[#3f361d] text-slate-600 dark:text-[#cbbc90]'}`}>
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

            {/* Daily Details Modal */}
            <AnimatePresence>
                {selectedDay !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedDay(null)}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-white dark:bg-[#2b2616] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-[#493f22]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-[#493f22] flex justify-between items-center bg-slate-50 dark:bg-[#231e10]">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                        {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-[#cbbc90]">{t('dashboard.transactions') || 'Transactions'}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-[#39321c] flex items-center justify-center text-slate-500 dark:text-[#cbbc90] hover:bg-slate-200 dark:hover:bg-[#4a4225] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>

                            <div className="p-4 md:p-6 max-h-[50vh] overflow-y-auto">
                                {selectedTransactions.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 dark:text-[#8e8568]">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-[#342d18] rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="material-symbols-outlined text-3xl">receipt_long</span>
                                        </div>
                                        <p className="font-medium text-sm">No transactions on this day</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {selectedTransactions.map((tx, idx) => (
                                            <div key={tx.id || idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-[#1e1a0f] border border-slate-100 dark:border-[#39321c]">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm ${tx.type === 'income' ? 'bg-green-500 shadow-green-500/20' : 'bg-slate-800 dark:bg-[#342d18] shadow-slate-800/20'}`}>
                                                        <span className="material-symbols-outlined text-[20px]">{tx.icon || (tx.type === 'income' ? 'south_west' : 'north_east')}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{tx.merchant || tx.description || 'Transaction'}</p>
                                                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] capitalize truncate">{tx.category || tx.type}</p>
                                                    </div>
                                                </div>
                                                <div className={`shrink-0 ml-4 font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                                                    {tx.type === 'income' ? '+' : '-'}
                                                    <HiddenAmount value={Number(tx.amount)} prefix="Rp " isImportant />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedTransactions.length > 0 && (
                                <div className="p-4 border-t border-slate-100 dark:border-[#493f22] bg-slate-50 dark:bg-[#1a170d] flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-[#cbbc90] font-bold text-sm tracking-wide uppercase">Daily Net</span>
                                    <span className={`font-black text-xl ${dailyStats[selectedDay]?.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {dailyStats[selectedDay]?.net >= 0 ? '+' : ''}
                                        <HiddenAmount value={dailyStats[selectedDay]?.net ?? 0} prefix="Rp " isImportant />
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CashFlowChart;
