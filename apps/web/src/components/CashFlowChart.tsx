import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import HiddenAmount from './HiddenAmount';

interface CashFlowChartProps {
    income: number;
    expense: number;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ income, expense }) => {
    const { t } = useLanguage();
    const netFlow = income - expense;
    // Calculate percentages for bars (max as base if possible, or simple ratio)
    const maxVal = Math.max(income, expense, 1); // Avoid div by zero
    const incomeWidth = Math.min((income / maxVal) * 100, 100);
    const expenseWidth = Math.min((expense / maxVal) * 100, 100);

    return (
        <div className="xl:col-span-2 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-[#493f22] shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.cashFlow')}</h3>
                    <p className="text-sm text-slate-500 dark:text-[#cbbc90]">{t('dashboard.incomeVsExpense')}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider font-bold">{t('dashboard.netFlow')}</p>
                    <p className={`text-xl font-bold ${netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        {netFlow >= 0 ? '+' : '-'}
                        <HiddenAmount value={Math.abs(netFlow)} prefix="Rp " isImportant />
                    </p>
                </div>
            </div>
            {/* Visual Representation */}
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
                {/* Fixed Costs & Discretionary placeholders for now */}
            </div>
        </div>
    );
};

export default CashFlowChart;
