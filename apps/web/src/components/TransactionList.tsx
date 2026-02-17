import React, { useEffect, useState } from 'react';
import { transactionService } from '../services/transactionService';
import type { Transaction } from '../types';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import HiddenAmount from './HiddenAmount';

interface TransactionListProps {
    limit?: number;
}

const TransactionList: React.FC<TransactionListProps> = ({ limit }) => {
    const { t } = useLanguage();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await transactionService.getAll();
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
            setError("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    if (loading) return <div className="p-6">{t('common.loading')}</div>;

    return (
        <div className="xl:col-span-1 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-[#493f22] shadow-sm p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.recentTransactions')}</h3>
                <Link to="/transactions" className="text-sm font-medium text-primary hover:text-[#dcb02d] transition-colors">{t('dashboard.viewAll')}</Link>
            </div>
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1">
                {loading ? (
                    <div className="text-center py-4 text-slate-500">{t('common.loading')}</div>
                ) : error ? (
                    <div className="text-center py-4 text-red-500 flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm">{error}</p>
                        <button onClick={fetchTransactions} className="text-xs font-bold text-primary underline">Retry</button>
                    </div>
                ) : transactions.length === 0 ? (
                    <p className="text-gray-500 text-sm">{t('transactions.noTransactions')}</p>
                ) : (
                    transactions.slice(0, limit || transactions.length).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'expense'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    }`}>
                                    <span className="material-symbols-outlined text-[20px]">{transaction.icon || (transaction.type === 'expense' ? 'shopping_cart' : 'paid')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{transaction.merchant || transaction.description}</p>
                                    <p className="text-xs text-slate-500 dark:text-[#cbbc90]">{transaction.category} • {new Date(transaction.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className={`text-sm font-bold ${transaction.type === 'expense'
                                ? 'text-slate-900 dark:text-white'
                                : 'text-green-600 dark:text-green-400'
                                }`}>
                                {transaction.type === 'expense' ? '-' : '+'}
                                <HiddenAmount value={Number(transaction.amount)} prefix="Rp " isImportant={false} className="" />
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TransactionList;
