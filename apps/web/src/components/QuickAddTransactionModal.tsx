
import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { useNotification } from '../contexts/NotificationContext';
import { aiService } from '../services/aiService';

interface QuickAddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransactionAdded?: () => void; // Optional callback to refresh list
}

const CATEGORIES = [
    { id: 'food', name: 'Food', icon: 'restaurant' },
    { id: 'transport', name: 'Transport', icon: 'directions_car' },
    { id: 'fun', name: 'Fun', icon: 'celebration' },
    { id: 'health', name: 'Health', icon: 'cardiology' },
    { id: 'bills', name: 'Bills', icon: 'receipt_long' },
    { id: 'shopping', name: 'Shopping', icon: 'shopping_bag' },
];

const QuickAddTransactionModal: React.FC<QuickAddTransactionModalProps> = ({ isOpen, onClose, onTransactionAdded }) => {
    const { showNotification } = useNotification();
    const [amount, setAmount] = useState('0');
    const [selectedCategory, setSelectedCategory] = useState('food');
    const [transactionType, setTransactionType] = useState<'Expense' | 'Income'>('Expense');
    const [notes, setNotes] = useState('');
    const [walletSource, setWalletSource] = useState('Bank');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCategorizing, setIsCategorizing] = useState(false);


    // ... useEffects


    // Debounce Auto-Categorize
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (notes && notes.length > 2) { // Minimum length check
                handleAutoCategorize();
            }
        }, 1500); // 1.5 seconds debounce

        return () => clearTimeout(timeoutId);
    }, [notes]);

    // Handle keyboard input
    useEffect(() => {
        if (!isOpen) return;
        // ... existing handleKeyDown logic


        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') {
                handleNumberClick(parseInt(e.key));
            } else if (e.key === 'Backspace') {
                handleBackspace();
            } else if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter') {
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, amount, selectedCategory, transactionType, notes]);

    const handleNumberClick = (num: number) => {
        setAmount(prev => {
            if (prev === '0') return num.toString();
            if (prev.length > 12) return prev; // Limit length
            return prev + num;
        });
    };

    const handleBackspace = () => {
        setAmount(prev => {
            if (prev.length <= 1) return '0';
            return prev.slice(0, -1);
        });
    };

    const handleAutoCategorize = async () => {
        if (!notes) {
            showNotification("Please enter a merchant name in notes first", "error");
            return;
        }

        setIsCategorizing(true);
        try {
            const categoryName = await aiService.categorize(notes);
            console.log("AI Suggested:", categoryName);


            // Strict mapping based on new prompt
            const lowerCat = categoryName.toLowerCase();
            let matchedId = 'shopping'; // Default fallback

            if (lowerCat.includes('food')) matchedId = 'food';
            else if (lowerCat.includes('transport')) matchedId = 'transport';
            else if (lowerCat.includes('fun')) matchedId = 'fun';
            else if (lowerCat.includes('health')) matchedId = 'health';
            else if (lowerCat.includes('bill')) matchedId = 'bills';
            else if (lowerCat.includes('shop')) matchedId = 'shopping';

            setSelectedCategory(matchedId);
            showNotification(`Category set to ${CATEGORIES.find(c => c.id === matchedId)?.name}`, 'success');
        } catch (error) {
            console.error("Auto-categorization failed", error);
            showNotification("Failed to auto-categorize", "error");
        } finally {
            setIsCategorizing(false);
        }
    };

    const handleSave = async () => {
        if (amount === '0') return;
        setIsSubmitting(true);
        try {
            // Find category icon
            const categoryObj = CATEGORIES.find(c => c.id === selectedCategory);

            await transactionService.create({
                userId: '1', // Should be dynamic from auth context
                amount: parseInt(amount),
                category: transactionType === 'Income' ? 'Income' : (categoryObj?.name || 'Uncategorized'),
                date: new Date().toISOString(),
                merchant: notes || (transactionType === 'Income' ? 'Income' : 'Expense'), // Use notes as description/merchant
                type: transactionType === 'Expense' ? 'expense' : 'income',
                icon: transactionType === 'Income' ? 'attach_money' : (categoryObj?.icon || 'attach_money'),
                description: `${notes} (via ${walletSource})`
            });

            showNotification("Transaction successfully saved!");
            if (onTransactionAdded) onTransactionAdded();
            onClose();
        } catch (error) {
            console.error("Failed to save transaction", error);
            showNotification("Failed to save transaction", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val: string) => {
        // Simple formatter for display
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseInt(val));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-[960px] bg-white dark:bg-[#2a2515] rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-[#493f22] max-h-[90vh] overflow-y-auto md:overflow-visible" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#39321c] hover:bg-slate-200 dark:hover:bg-[#4a4225] flex items-center justify-center text-slate-500 dark:text-[#cbbc90] transition-colors"
                    aria-label="Close"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
                {/* Left Column: Input and Keypad */}
                <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-[#493f22]">
                    {/* Segmented Control (Income/Expense) */}
                    <div className="p-6 pb-2">
                        <div className="flex h-12 w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-[#39321c] p-1">
                            <label className="group flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md transition-all has-[:checked]:bg-white dark:has-[:checked]:bg-[#4a4225] has-[:checked]:shadow-sm">
                                <span className={`truncate text-slate-600 dark:text-[#cbbc90] font-bold text-sm ${transactionType === 'Expense' ? 'text-primary' : ''}`}>Expense</span>
                                <input
                                    checked={transactionType === 'Expense'}
                                    onChange={() => setTransactionType('Expense')}
                                    className="invisible w-0 absolute"
                                    name="transaction-type"
                                    type="radio"
                                    value="Expense"
                                />
                            </label>
                            <label className="group flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md transition-all has-[:checked]:bg-white dark:has-[:checked]:bg-[#4a4225] has-[:checked]:shadow-sm">
                                <span className={`truncate text-slate-600 dark:text-[#cbbc90] font-bold text-sm ${transactionType === 'Income' ? 'text-green-500' : ''}`}>Income</span>
                                <input
                                    checked={transactionType === 'Income'}
                                    onChange={() => setTransactionType('Income')}
                                    className="invisible w-0 absolute"
                                    name="transaction-type"
                                    type="radio"
                                    value="Income"
                                />
                            </label>
                        </div>
                    </div>
                    {/* Amount Display */}
                    <div className="px-6 py-4 text-center">
                        <p className="text-slate-500 dark:text-[#8e8568] text-sm font-medium mb-1">Enter Amount</p>
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-[48px] font-bold leading-tight">{formatCurrency(amount)}</h1>
                    </div>
                    {/* Keypad */}
                    <div className="flex-1 bg-slate-50 dark:bg-[#231e10] p-6">
                        <div className="grid grid-cols-3 gap-3 h-full">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    onClick={() => handleNumberClick(num)}
                                    key={num}
                                    className="flex items-center justify-center h-16 rounded-lg bg-white dark:bg-[#342d18] text-xl font-bold text-slate-700 dark:text-[#cbbc90] shadow-sm hover:bg-slate-50 dark:hover:bg-[#3f361d] active:scale-95 transition-transform"
                                >
                                    {num}
                                </button>
                            ))}
                            <button className="flex items-center justify-center h-16 rounded-lg bg-transparent text-xl font-bold text-slate-400 dark:text-[#685a31]"></button>
                            <button
                                onClick={() => handleNumberClick(0)}
                                className="flex items-center justify-center h-16 rounded-lg bg-white dark:bg-[#342d18] text-xl font-bold text-slate-700 dark:text-[#cbbc90] shadow-sm hover:bg-slate-50 dark:hover:bg-[#3f361d] active:scale-95 transition-transform"
                            >
                                0
                            </button>
                            <button
                                onClick={handleBackspace}
                                className="flex items-center justify-center h-16 rounded-lg bg-transparent text-xl font-bold text-slate-700 dark:text-[#cbbc90] hover:bg-slate-100 dark:hover:bg-[#3f361d] active:scale-95 transition-transform"
                            >
                                <span className="material-symbols-outlined">backspace</span>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Right Column: Details and Categories */}
                <div className="flex-1 flex flex-col bg-white dark:bg-[#2a2515]">
                    <div className="p-6 flex flex-col h-full">
                        <div className="mb-6 space-y-4">
                            {/* Source Account Select */}
                            <div>
                                <label className="block text-slate-500 dark:text-[#cbbc90] text-sm font-medium mb-2">Source Account</label>
                                <div className="relative">
                                    <select
                                        value={walletSource}
                                        onChange={(e) => setWalletSource(e.target.value)}
                                        className="appearance-none w-full rounded-lg border border-slate-200 dark:border-[#685a31] bg-slate-50 dark:bg-[#342d18] text-slate-900 dark:text-white p-4 pr-10 text-base font-normal focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow">
                                        <option value="Bank">Bank</option>
                                        <option value="Cash">Cash</option>
                                        <option value="E-wallet">E-wallet</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-[#cbbc90]">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            {/* Notes Input + AI Button */}
                            <div>

                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-slate-500 dark:text-[#cbbc90] text-sm font-medium">Notes / Merchant</label>
                                    {isCategorizing && (
                                        <span className="text-xs flex items-center gap-1 text-primary animate-pulse">
                                            <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                                            Auto-Cat...
                                        </span>
                                    )}
                                </div>

                                <input
                                    className="w-full rounded-lg border border-slate-200 dark:border-[#685a31] bg-slate-50 dark:bg-[#342d18] text-slate-900 dark:text-white p-4 text-base font-normal placeholder:text-slate-400 dark:placeholder:text-[#685a31] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                                    placeholder="e.g. Starbucks, Gojek, Tokopedia..."
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        {/* Categories Grid - Only for Expenses */}
                        {transactionType === 'Expense' && (
                            <div className="flex-1">
                                <label className="block text-slate-500 dark:text-[#cbbc90] text-sm font-medium mb-3">Category</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[320px] pr-1">
                                    {CATEGORIES.map(category => (
                                        <div
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category.id)}
                                            className={`group cursor-pointer flex flex-col gap-2 rounded-xl border p-3 items-center text-center transition-all ${selectedCategory === category.id ? 'border-2 border-primary bg-primary/10 dark:bg-primary/20 hover:shadow-md' : 'border-slate-200 dark:border-[#685a31] bg-slate-50 dark:bg-[#342d18] hover:border-primary hover:bg-slate-100 dark:hover:bg-[#3f361d]'}`}
                                        >
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${selectedCategory === category.id ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-[#493f22] text-slate-600 dark:text-[#cbbc90] group-hover:text-primary'}`}>
                                                <span className="material-symbols-outlined text-[20px]">{category.icon}</span>
                                            </div>
                                            <span className={`text-sm font-medium leading-tight ${selectedCategory === category.id ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-700 dark:text-[#cbbc90] group-hover:text-slate-900 dark:group-hover:text-white'}`}>{category.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Action Button */}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#39321c]">
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className={`w-full h-14 rounded-lg bg-primary hover:bg-primary/90 text-slate-900 font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="material-symbols-outlined">check</span>
                                {isSubmitting ? 'Saving...' : 'Save Transaction'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickAddTransactionModal;
