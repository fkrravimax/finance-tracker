import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ExpensesByCategory from './ExpensesByCategory';

interface BudgetBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BudgetBreakdownModal: React.FC<BudgetBreakdownModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#2a2515] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-[#493f22] flex justify-between items-center bg-surface-light dark:bg-[#342d18]">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('dashboard.budgetBreakdown')}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-[#cbbc90] dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <ExpensesByCategory />
                </div>
            </div>
        </div>
    );
};

export default BudgetBreakdownModal;
