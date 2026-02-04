
import React, { useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import CurrencyInput from './CurrencyInput';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onComplete }) => {
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Remove non-numeric chars for formatted input
            const rawValue = budget.replace(/[^0-9]/g, '');
            await dashboardService.setBudget(Number(rawValue));
            onComplete();
            onClose();
        } catch (error) {
            console.error("Failed to set budget", error);
            alert("Failed to set budget");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#2a2515] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-[#493f22]">
                <div className="text-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">savings</span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Welcome to FinTrack!</h2>
                    <p className="text-slate-500 dark:text-[#cbbc90]">Let's set up your financial goals. Start by setting a monthly budget limit.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    <div>
                        <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90] mb-1 block">Monthly Budget Limit (Rp)</label>
                        <CurrencyInput
                            value={budget}
                            onChange={(val) => setBudget(val.toString())} // Convert number to string for state
                            placeholder="e.g. 5.000.000"
                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-[#dca60e] text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-70 mt-4"
                    >
                        {loading ? 'Saving...' : 'Start Tracking'}
                    </button>

                    {/* Add Skip button purely for UX, though user requirement implies forced onboarding, keeping it soft for now */}
                    <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        Skip for now
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingModal;
