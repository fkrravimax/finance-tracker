import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { transactionService } from '../services/transactionService';

// Reusable component
const ExpensesByCategory: React.FC = () => {
    const { t } = useLanguage();
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1); // Start of current month
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [categories, setCategories] = useState<{ category: string, amount: number, percentage: number }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategoryData();
    }, [startDate, endDate]);

    const fetchCategoryData = async () => {
        setLoading(true);
        try {
            const start = new Date(startDate);
            const transactions = await transactionService.getAll(start.getMonth(), start.getFullYear());

            // Filter by date and type 'expense'
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include full end day

            const filtered = transactions.filter((t: any) => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && tDate >= start && tDate <= end;
            });

            // Group by category
            const grouped: Record<string, number> = {};
            let total = 0;

            filtered.forEach(t => {
                const amount = Number(t.amount);
                grouped[t.category] = (grouped[t.category] || 0) + amount;
                total += amount;
            });

            // Format for display
            const result = Object.entries(grouped)
                .map(([category, amount]) => ({
                    category,
                    amount,
                    percentage: total > 0 ? (amount / total) * 100 : 0
                }))
                .sort((a, b) => b.amount - a.amount); // Sort by highest expense

            setCategories(result);
        } catch (error) {
            console.error("Failed to fetch category data", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6" id="category-report">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('reports.expensesByCategory')}</h3>

                {/* Date Filters */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#342d18] p-1 rounded-lg border border-slate-200 dark:border-[#493f22]">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-700 dark:text-[#cbbc90] outline-none px-2 py-1"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-700 dark:text-[#cbbc90] outline-none px-2 py-1"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-slate-500">{t('common.loading')}</div>
            ) : categories.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-[#cbbc90] flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl opacity-50">data_usage</span>
                    <p>{t('reports.noExpenses')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* List View */}
                    <div className="flex flex-col gap-4">
                        {categories.map((cat) => (
                            <div key={cat.category} className="flex flex-col gap-1">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-slate-900 dark:text-white">{cat.category}</span>
                                    <div className="text-right">
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {cat.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-[#cbbc90] ml-2">({cat.percentage.toFixed(1)}%)</span>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-[#342d18] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${cat.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary / Placeholder for Chart */}
                    <div className="flex items-center justify-center bg-slate-50 dark:bg-[#342d18]/50 rounded-xl p-6 border border-slate-100 dark:border-[#493f22] border-dashed">
                        <div className="text-center">
                            <p className="text-slate-500 dark:text-[#cbbc90] mb-2">{t('reports.totalExpensesPeriod')}</p>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white">
                                {categories.reduce((acc, c) => acc + c.amount, 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                            </h2>
                            <p className="text-xs text-slate-400 mt-2">
                                {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensesByCategory;
