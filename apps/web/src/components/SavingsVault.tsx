import React, { useState, useEffect, useMemo } from 'react';
import { savingsService, type SavingsGoal } from '../services/savingsService';
import CurrencyInput from './CurrencyInput';
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../contexts/NotificationContext';
import SavingsVaultSkeleton from './skeletons/SavingsVaultSkeleton';

// Helper to get dynamic image based on name using Bing Images (More reliable for search terms)
const getGoalImage = (name: string): string => {
    const firstWord = name.trim().split(' ')[0] || 'savings';
    // Use Bing Thumbnail API for fast, reliable keyword search images
    // w=600&h=400 ensures good resolution for the card header
    // c=7 makes it crop to fill
    return `https://tse4.mm.bing.net/th?q=${encodeURIComponent(firstWord)}&w=600&h=400&c=7&rs=1`;
};

const SavingsVault: React.FC = () => {
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [updateAmount, setUpdateAmount] = useState('');
    const [updateType, setUpdateType] = useState<'deposit' | 'withdraw'>('deposit');
    const { showNotification } = useNotification();
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        goalId: string | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        goalId: null,
        isLoading: false
    });

    // Toggle Menu
    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Create Goal State
    const [createFormData, setCreateFormData] = useState({
        name: '',
        targetAmount: '',
        targetDate: ''
    });

    // Fetch Goals on Mount
    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 300)); // Artificial delay for smooth UX
            const data = await savingsService.getAll();
            setGoals(data);
        } catch (error) {
            console.error("Failed to fetch goals", error);
            showNotification('Failed to load savings goals', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Stats Calculation
    const totalSaved = useMemo(() => goals.reduce((acc, goal) => acc + Number(goal.currentAmount || 0), 0), [goals]);
    const activeGoalsCount = goals.length;

    // Calculate real monthly target based on remaining amount and time left for all goals
    const monthlySavings = useMemo(() => {
        const now = new Date();
        return goals.reduce((acc, goal) => {
            if (!goal.targetDate) return acc;
            const targetDate = new Date(goal.targetDate);
            const monthsLeft = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
            if (monthsLeft <= 0) return acc;

            const remaining = Number(goal.targetAmount) - Number(goal.currentAmount || 0);
            if (remaining <= 0) return acc;

            return acc + (remaining / monthsLeft);
        }, 0);
    }, [goals]);

    // Actions
    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);
    const handleOpenUpdateModal = (id: string, type: 'deposit' | 'withdraw') => {
        setSelectedGoalId(id);
        setUpdateType(type);
        setUpdateAmount('');
        setIsUpdateModalOpen(true);
    };
    const handleCloseUpdateModal = () => setIsUpdateModalOpen(false);

    const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCreateFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await savingsService.create({
                name: createFormData.name,
                targetAmount: Number(createFormData.targetAmount),
                targetDate: createFormData.targetDate,
                category: 'Other', // Could be inferred or selected
                image: getGoalImage(createFormData.name)
            });
            await fetchGoals();
            handleCloseCreateModal();
            showNotification('New savings goal created!');
            setCreateFormData({ name: '', targetAmount: '', targetDate: '' });
        } catch (error) {
            console.error("Failed to create goal", error);
            showNotification('Failed to create goal', 'error');
        }
    };

    const handleUpdateSavings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoalId || !updateAmount) return;

        try {
            await savingsService.updateAmount(selectedGoalId, Number(updateAmount), updateType);
            await fetchGoals();
            handleCloseUpdateModal();
            showNotification(`Successfully ${updateType === 'deposit' ? 'added' : 'withdrew'} funds.`);
        } catch (error) {
            console.error("Failed to update savings", error);
            showNotification('Failed to update savings. Check funds.', 'error');
        }
    };

    const handleDeleteGoalClick = (id: string) => {
        setConfirmation({
            isOpen: true,
            goalId: id,
            isLoading: false
        });
        // Close menu
        setActiveMenuId(null);
    };

    const handleConfirmDelete = async () => {
        if (!confirmation.goalId) return;

        setConfirmation(prev => ({ ...prev, isLoading: true }));
        try {
            await savingsService.delete(confirmation.goalId);
            setGoals(prevGoals => prevGoals.filter(g => g.id !== confirmation.goalId));
            showNotification('Goal deleted.');
            setConfirmation({ isOpen: false, goalId: null, isLoading: false });
        } catch (error) {
            console.error("Failed to delete goal", error);
            showNotification('Failed to delete goal', 'error');
            setConfirmation(prev => ({ ...prev, isLoading: false }));
        }
    };

    // Format Currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    // Calculate Progress
    const getProgress = (current: number, target: number) => Math.min(100, Math.round((Number(current) / Number(target)) * 100));

    if (loading) {
        return <SavingsVaultSkeleton />;
    }

    return (
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12 flex flex-col gap-8 relative">

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="Delete Saving Goal?"
                message="Are you sure you want to delete this goal? All your progress and history for this goal will be removed permanently."
                variant="danger"
                cancelText="Keep Goal"
                confirmText="Delete"
                isLoading={confirmation.isLoading}
            />

            {/* Create Goal Modal */}
            {
                isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseCreateModal}></div>
                        <div className="relative bg-white dark:bg-[#2a2515] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                            <div className="p-6 border-b border-slate-100 dark:border-[#493f22] flex justify-between items-center bg-surface-light dark:bg-[#342d18]">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Goal</h3>
                                <button onClick={handleCloseCreateModal} className="text-slate-400 hover:text-slate-600 dark:text-[#cbbc90] dark:hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleCreateSubmit} className="p-6 flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Goal Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={createFormData.name}
                                        onChange={handleCreateInputChange}
                                        placeholder="e.g. Dream House"
                                        className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Target Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-bold">Rp</span>
                                        <CurrencyInput
                                            // name="targetAmount" - Removed as CurrencyInput might not forward currently, logic handled via onChange wrapper
                                            value={createFormData.targetAmount}
                                            onChange={(val) => setCreateFormData(prev => ({ ...prev, targetAmount: val.toString() }))}
                                            placeholder="0"
                                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Target Date</label>
                                    <div className="flex gap-2 mb-1">
                                        {[3, 6, 12].map((months) => (
                                            <button
                                                key={months}
                                                type="button"
                                                onClick={() => {
                                                    const date = new Date();
                                                    date.setMonth(date.getMonth() + months);
                                                    const dateString = date.toISOString().split('T')[0];
                                                    setCreateFormData(prev => ({ ...prev, targetDate: dateString }));
                                                }}
                                                className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-[#342d18] text-slate-600 dark:text-[#cbbc90] hover:bg-primary hover:text-slate-900 border border-slate-200 dark:border-[#493f22] transition-colors"
                                            >
                                                +{months === 12 ? '1 Year' : `${months} Months`}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="date"
                                        name="targetDate"
                                        value={createFormData.targetDate}
                                        onChange={handleCreateInputChange}
                                        className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                        required
                                    />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full bg-primary hover:bg-[#dca60e] text-slate-900 font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/25 active:scale-95">
                                        Create Goal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Update Savings Modal */}
            {
                isUpdateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseUpdateModal}></div>
                        <div className="relative bg-white dark:bg-[#2a2515] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                            <div className="p-6 border-b border-slate-100 dark:border-[#493f22] flex justify-between items-center bg-surface-light dark:bg-[#342d18]">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {updateType === 'deposit' ? 'Add Savings' : 'Withdraw Funds'}
                                </h3>
                                <button onClick={handleCloseUpdateModal} className="text-slate-400 hover:text-slate-600 dark:text-[#cbbc90] dark:hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleUpdateSavings} className="p-6 flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-bold">Rp</span>
                                        <CurrencyInput
                                            value={updateAmount}
                                            onChange={(val) => setUpdateAmount(val.toString())}
                                            placeholder="0"
                                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 ${updateType === 'deposit' ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/25' : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25'}`}
                                    >
                                        {updateType === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Page Heading & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">My Goals</h1>
                    <p className="text-slate-500 dark:text-[#cbbc90] text-base">Track your dreams and hit your targets faster.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="group flex items-center justify-center gap-2 bg-primary hover:bg-[#dca60e] text-black px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/20 active:scale-95"
                >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
                    <span>Create New Goal</span>
                </button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stat 1: Total Saved */}
                <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-[#342d18] shadow-sm border border-slate-100 dark:border-[#493f22]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                        </div>
                        <p className="text-slate-500 dark:text-[#cbbc90] font-medium">Total Saved</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalSaved)}</p>
                        <div className="flex items-center gap-1 mt-1 text-sm font-medium text-green-500">
                            <span className="material-symbols-outlined text-base">trending_up</span>
                            <span>On Track</span>
                        </div>
                    </div>
                </div>
                {/* Stat 2: Active Goals */}
                <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-[#342d18] shadow-sm border border-slate-100 dark:border-[#493f22]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <span className="material-symbols-outlined">flag</span>
                        </div>
                        <p className="text-slate-500 dark:text-[#cbbc90] font-medium">Active Goals</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeGoalsCount} Goals</p>
                        <p className="text-sm mt-1 text-slate-400 dark:text-[#cbbc90]">Keep it up!</p>
                    </div>
                </div>
                {/* Stat 3: Monthly Save Rate */}
                <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-[#342d18] shadow-sm border border-slate-100 dark:border-[#493f22]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <p className="text-slate-500 dark:text-[#cbbc90] font-medium">Monthly Target</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(monthlySavings)}</p>
                        <p className="text-sm mt-1 text-slate-400 dark:text-[#cbbc90]">Needed to hit targets</p>
                    </div>
                </div>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => {
                    const percentage = getProgress(goal.currentAmount, goal.targetAmount);
                    return (
                        <div key={goal.id} className="group flex flex-col bg-white dark:bg-[#342d18] rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-[#493f22]">
                            <div className="h-48 w-full bg-cover bg-center relative rounded-t-2xl" style={{ backgroundImage: `url("${getGoalImage(goal.name)}")` }}>
                                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                                    {goal.category}
                                </div>
                            </div>
                            <div className="p-5 flex flex-col gap-4 flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{goal.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-[#cbbc90]">Target: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Ongoing'}</p>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={(e) => toggleMenu(e, goal.id)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${activeMenuId === goal.id ? 'bg-primary text-black' : 'bg-slate-100 dark:bg-[#493f22] text-slate-400 dark:text-[#cbbc90] hover:text-primary'}`}
                                        >
                                            <span className="material-symbols-outlined">more_horiz</span>
                                        </button>

                                        {activeMenuId === goal.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#2f2a1a] rounded-xl shadow-xl border border-slate-100 dark:border-[#493f22] overflow-hidden z-20 animate-scale-in origin-top-right">
                                                <button
                                                    onClick={() => handleOpenUpdateModal(goal.id, 'deposit')}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-[#cbbc90] hover:bg-slate-50 dark:hover:bg-[#3f3823] flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-green-500">add_circle</span> Add Funds
                                                </button>
                                                <button
                                                    onClick={() => handleOpenUpdateModal(goal.id, 'withdraw')}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-[#cbbc90] hover:bg-slate-50 dark:hover:bg-[#3f3823] flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-orange-500">remove_circle</span> Withdraw Funds
                                                </button>
                                                <div className="h-px bg-slate-100 dark:bg-[#3f3823] mx-3 my-1"></div>
                                                <button
                                                    onClick={() => handleDeleteGoalClick(goal.id)}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined">delete</span> Delete Goal
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-auto">
                                    <div className="flex justify-between items-end text-sm">
                                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(goal.currentAmount)}</span>
                                        <span className="text-slate-500 dark:text-[#cbbc90]">of {formatCurrency(goal.targetAmount)}</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 dark:bg-[#231e10] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium mt-1">
                                        <span className={`${percentage >= 100 ? 'text-green-500' : 'text-primary'}`}>{percentage}% Saved</span>
                                        <span className="text-slate-400 dark:text-[#8e8568]">{percentage >= 100 ? 'Completed' : 'On Track'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State / Add  */}
                <button
                    onClick={handleOpenCreateModal}
                    className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#493f22] p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-slate-50 dark:hover:bg-[#493f22]/30 transition-colors cursor-pointer group min-h-[300px]"
                >
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#231e10] flex items-center justify-center text-slate-400 dark:text-[#cbbc90] group-hover:text-primary group-hover:scale-110 transition-all">
                        <span className="material-symbols-outlined text-3xl">add_circle</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Another Goal</h3>
                        <p className="text-sm text-slate-500 dark:text-[#cbbc90]">Start saving for something new</p>
                    </div>
                </button>
            </div>
        </div >
    );
};

export default SavingsVault;
