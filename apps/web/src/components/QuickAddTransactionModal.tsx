
import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { useNotification } from '../contexts/NotificationContext';
import { aiService } from '../services/aiService';
import api from '../services/api';
import { Transaction } from '../types';

interface QuickAddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransactionAdded?: () => void;
    initialData?: {
        id: string;
        merchant: string;
        category: string;
        amount: string | number;
        type: 'income' | 'expense';
        date: string;
        notes?: string;
        source?: string;
        walletId?: string;
    } | null;
}

const CATEGORIES = [
    { id: 'food', name: 'Food', icon: 'restaurant' },
    { id: 'transport', name: 'Transport', icon: 'directions_car' },
    { id: 'fun', name: 'Fun', icon: 'celebration' },
    { id: 'health', name: 'Health', icon: 'cardiology' },
    { id: 'bills', name: 'Bills', icon: 'receipt_long' },
    { id: 'shopping', name: 'Shopping', icon: 'shopping_bag' },
];

const QuickAddTransactionModal: React.FC<QuickAddTransactionModalProps> = ({ isOpen, onClose, onTransactionAdded, initialData }) => {
    const { showNotification } = useNotification();
    const [amount, setAmount] = useState('0');
    const [selectedCategory, setSelectedCategory] = useState('food');
    const [transactionType, setTransactionType] = useState<'Expense' | 'Income'>('Expense');
    const [notes, setNotes] = useState('');
    const [wallets, setWallets] = useState<{ id: string, name: string }[]>([]);
    const [isLoadingWallets, setIsLoadingWallets] = useState(false);
    const [walletSource, setWalletSource] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCategorizing, setIsCategorizing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Fetch wallets
            const fetchWallets = async () => {
                setIsLoadingWallets(true);
                try {
                    const { data } = await api.get('/wallets');
                    setWallets(data);

                    // Set default if not set
                    if (!initialData && data.length > 0 && !data.find((w: any) => w.id === walletSource)) {
                        setWalletSource(data[0].id);
                    }
                } catch (error) {
                    console.error("Failed to fetch wallets", error);
                } finally {
                    setIsLoadingWallets(false);
                }
            };
            fetchWallets();

            if (initialData) {
                setAmount(initialData.amount.toString());
                setNotes(initialData.merchant); // Merchant as notes
                setTransactionType(initialData.type === 'income' ? 'Income' : 'Expense');
                // walletSource should be in initialData if we supported editing wallet, but for now we might default or parse description?
                // For now, let's leave it or try to find it. 
                // If backend provided walletId in transaction, we'd use it. 
                // Since initialData structure might need update, let's assume default for now or matches one.

                // Try to match category name to ID
                const catObj = CATEGORIES.find(c => c.name === initialData.category);
                if (catObj) setSelectedCategory(catObj.id);
                else setSelectedCategory('shopping'); // Fallback
            } else {
                // Reset form
                setAmount('0');
                setNotes('');
                setTransactionType('Expense');
                setSelectedCategory('food');
                // walletSource set after fetch
            }
        }
    }, [isOpen, initialData]);


    // Debounce Auto-Categorize
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Only auto-categorize if NOT editing and user is typing notes
            if (!initialData && notes && notes.length > 2) {
                handleAutoCategorize();
            }
        }, 1500);

        return () => clearTimeout(timeoutId);
    }, [notes, initialData]);

    const handleSave = async () => {
        if (amount === '0') return;
        setIsSubmitting(true);
        try {
            // Find category icon
            const categoryObj = CATEGORIES.find(c => c.id === selectedCategory);

            // Explicitly cast type to match Transaction interface
            const typeValue: 'income' | 'expense' = transactionType === 'Expense' ? 'expense' : 'income';

            const payload = {
                amount: parseInt(amount),
                category: transactionType === 'Income' ? 'Income' : (categoryObj?.name || 'Uncategorized'),
                date: initialData ? initialData.date : new Date().toISOString(), // Keep original date if editing
                merchant: notes || (transactionType === 'Income' ? 'Income' : 'Expense'),
                type: typeValue,
                icon: transactionType === 'Income' ? 'attach_money' : (categoryObj?.icon || 'attach_money'),
                description: notes,
                walletId: walletSource // Send the ID directly
            };

            if (initialData) {
                await transactionService.update(initialData.id, payload);
                showNotification("Transaction updated successfully!");
            } else {
                await transactionService.create(payload);
                showNotification("Transaction saved successfully!");
            }

            // Dispatch global event
            window.dispatchEvent(new Event('transaction-updated'));

            if (onTransactionAdded) onTransactionAdded();
            onClose();
        } catch (error) {
            console.error("Failed to save transaction", error);
            showNotification("Failed to save transaction", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

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

    // Handle keyboard input
    useEffect(() => {
        if (!isOpen) return;

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
    }, [isOpen, amount, selectedCategory, transactionType, notes, onClose]); // Removed handleSave from dep to avoid cycle, strictly it should be there but function is stable enough or use useCallback

    const handleAutoCategorize = async () => {
        if (!notes) {
            showNotification("Please enter a merchant name in notes first", "error");
            return;
        }

        setIsCategorizing(true);
        try {
            const categoryName = await aiService.categorize(notes);

            const lowerCat = categoryName.toLowerCase();
            let matchedId = '';

            if (lowerCat.includes('food')) matchedId = 'food';
            else if (lowerCat.includes('transport')) matchedId = 'transport';
            else if (lowerCat.includes('fun')) matchedId = 'fun';
            else if (lowerCat.includes('health')) matchedId = 'health';
            else if (lowerCat.includes('bill')) matchedId = 'bills';
            else if (lowerCat.includes('shop') || lowerCat.includes('belanja')) matchedId = 'shopping';
            else if (lowerCat.includes('other')) matchedId = 'shopping';

            if (matchedId) {
                setSelectedCategory(matchedId);
                const categoryName = CATEGORIES.find(c => c.id === matchedId)?.name;
                showNotification(`Category set to ${categoryName}`, 'success');
            } else {
                setSelectedCategory('shopping');
            }
        } catch (error) {
            console.error("Auto-categorization failed", error);
        } finally {
            setIsCategorizing(false);
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
                    <div className="p-4 md:p-6 pb-2">
                        <div className="flex h-10 md:h-12 w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-[#39321c] p-1">
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
                    <div className="px-4 py-2 md:px-6 md:py-4 text-center">
                        <p className="text-slate-500 dark:text-[#8e8568] text-xs md:text-sm font-medium mb-1">Enter Amount</p>
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-[36px] md:text-[48px] font-bold leading-tight">{formatCurrency(amount)}</h1>
                    </div>
                    {/* Keypad */}
                    <div className="flex-1 bg-slate-50 dark:bg-[#231e10] p-4 md:p-6">
                        <div className="grid grid-cols-3 gap-2 md:gap-3 h-full">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    onClick={() => handleNumberClick(num)}
                                    key={num}
                                    className="flex items-center justify-center h-12 md:h-16 rounded-lg bg-white dark:bg-[#342d18] text-xl font-bold text-slate-700 dark:text-[#cbbc90] shadow-sm hover:bg-slate-50 dark:hover:bg-[#3f361d] active:scale-95 transition-transform"
                                >
                                    {num}
                                </button>
                            ))}
                            <button className="flex items-center justify-center h-16 rounded-lg bg-transparent text-xl font-bold text-slate-400 dark:text-[#685a31]"></button>
                            <button
                                onClick={() => handleNumberClick(0)}
                                className="flex items-center justify-center h-12 md:h-16 rounded-lg bg-white dark:bg-[#342d18] text-xl font-bold text-slate-700 dark:text-[#cbbc90] shadow-sm hover:bg-slate-50 dark:hover:bg-[#3f361d] active:scale-95 transition-transform"
                            >
                                0
                            </button>
                            <button
                                onClick={handleBackspace}
                                className="flex items-center justify-center h-12 md:h-16 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-[#3f361d] text-slate-700 dark:text-[#cbbc90] active:scale-95 transition-transform"
                            >
                                <span className="material-symbols-outlined text-2xl">backspace</span>
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
                                        disabled={isLoadingWallets}
                                        className="appearance-none w-full rounded-lg border border-slate-200 dark:border-[#685a31] bg-slate-50 dark:bg-[#342d18] text-slate-900 dark:text-white p-4 pr-10 text-base font-normal focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow disabled:opacity-50">
                                        {wallets.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                        {wallets.length === 0 && <option disabled>Loading wallets...</option>}
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
