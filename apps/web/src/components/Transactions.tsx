import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api';
import TransactionTableSkeleton from './skeletons/TransactionTableSkeleton';
import { useLanguage } from '../contexts/LanguageContext';

type TimeRange = 'day' | 'week' | 'month' | 'year';
type SortKey = 'category' | 'date' | 'amount';
type SortDirection = 'asc' | 'desc';

interface Transaction {
    id: string;
    merchant: string;
    category: string;
    date: string; // ISO string from DB
    amount: string | number; // Decimal comes as string from DB usually
    type: 'income' | 'expense';
    icon: string;
    colorClass?: string;
}

const Transactions: React.FC = () => {
    const { t } = useLanguage();
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

    const fetchTransactions = async () => {
        try {
            // Add artificial delay ensuring skeleton is visible for UX smooth transition (optional)
            const [response] = await Promise.all([
                api.get('/transactions'),
                new Promise(resolve => setTimeout(resolve, 500))
            ]);
            setTransactions(response.data);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();

        // Listen for global transaction updates
        const handleTransactionUpdate = () => {
            fetchTransactions();
        };
        window.addEventListener('transaction-updated', handleTransactionUpdate);

        return () => {
            window.removeEventListener('transaction-updated', handleTransactionUpdate);
        };
    }, []);

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        // Default sorts: Date -> newest (desc), Amount -> largest (desc)
        if (!sortConfig && (key === 'date' || key === 'amount')) {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let result = transactions.filter(t => {
            const tDate = new Date(t.date);
            switch (timeRange) {
                case 'day':
                    return tDate >= startOfDay;
                case 'week':
                    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return tDate >= oneWeekAgo;
                case 'month':
                    return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                case 'year':
                    return tDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });

        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: any = a[sortConfig.key];
                let bValue: any = b[sortConfig.key];

                if (sortConfig.key === 'amount') {
                    aValue = Number(aValue);
                    bValue = Number(bValue);
                } else if (sortConfig.key === 'date') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                } else {
                    // String comparison (Category)
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default sort by date desc if no specific sort
            result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        return result;
    }, [timeRange, transactions, sortConfig]);

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR' }).format(Number(amount));
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    };

    const getTransactionStyle = (t: Transaction) => {
        if (t.type === 'income') return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
        return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-[#493f22]';
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig?.key !== column) return <span className="material-symbols-outlined text-[16px] opacity-30">unfold_more</span>;
        return <span className="material-symbols-outlined text-[16px] text-primary">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>;
    };

    if (loading) {
        return <TransactionTableSkeleton />;
    }

    return (
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12 flex flex-col gap-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 overflow-hidden">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('transactions.title')}</h1>
                    <p className="text-slate-500 dark:text-[#cbbc90] text-base">{t('transactions.subtitle')}</p>
                </div>

                {/* Filter Controls */}
                <div className="flex w-full md:w-auto bg-slate-100 dark:bg-[#2b2616] p-1 rounded-xl border border-slate-200 dark:border-[#493f22] overflow-x-auto no-scrollbar">
                    {(['day', 'week', 'month', 'year'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap ${timeRange === range
                                ? 'bg-white dark:bg-[#493f22] text-primary shadow-sm'
                                : 'text-slate-500 dark:text-[#cbbc90] hover:text-slate-700 dark:hover:text-white'
                                }`}
                        >
                            {t(`transactions.ranges.${range}` as any)}
                        </button>
                    ))}
                </div>
            </header>

            {/* Stats Overview for Filtered Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#342d18] p-6 rounded-2xl border border-slate-100 dark:border-[#493f22] flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-[#cbbc90]">{t('transactions.income')}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0))}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#342d18] p-6 rounded-2xl border border-slate-100 dark:border-[#493f22] flex items-center gap-4">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                        <span className="material-symbols-outlined">trending_down</span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-[#cbbc90]">{t('transactions.expense')}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0))}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#342d18] p-6 rounded-2xl border border-slate-100 dark:border-[#493f22] flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-[#cbbc90]">{t('transactions.totalTransactions')}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {filteredTransactions.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#2b2616] border-b border-slate-200 dark:border-[#493f22] select-none">
                                <th className="p-4 pl-6 text-sm font-bold text-slate-600 dark:text-[#cbbc90] whitespace-nowrap">{t('transactions.merchant')}</th>
                                <th
                                    className="p-4 text-sm font-bold text-slate-600 dark:text-[#cbbc90] whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-[#493f22] transition-colors"
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-1">
                                        {t('transactions.category')} <SortIcon column="category" />
                                    </div>
                                </th>
                                <th
                                    className="p-4 text-sm font-bold text-slate-600 dark:text-[#cbbc90] whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-[#493f22] transition-colors"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center gap-1">
                                        {t('transactions.date')} <SortIcon column="date" />
                                    </div>
                                </th>
                                <th
                                    className="p-4 text-sm font-bold text-slate-600 dark:text-[#cbbc90] whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-[#493f22] transition-colors"
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center gap-1">
                                        {t('transactions.amount')} <SortIcon column="amount" />
                                    </div>
                                </th>
                                <th className="p-4 pr-6 text-sm font-bold text-slate-600 dark:text-[#cbbc90] whitespace-nowrap text-right">{t('transactions.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#493f22]">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-[#493f22]/30 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionStyle(transaction)}`}>
                                                    <span className="material-symbols-outlined text-[20px]">{transaction.icon || (transaction.type === 'income' ? 'paid' : 'receipt')}</span>
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white">{transaction.merchant}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-[#cbbc90]">{transaction.category}</td>
                                        <td className="p-4 text-sm text-slate-500 dark:text-[#cbbc90]">{formatDate(transaction.date)}</td>
                                        <td className={`p-4 font-bold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <span className="inline-block px-2 py-1 text-xs font-bold rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                {t('transactions.completed')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500 dark:text-[#cbbc90]">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl opacity-50">receipt_long</span>
                                            <p>{t('transactions.noTransactions')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
