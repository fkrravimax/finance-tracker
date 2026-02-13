import React, { useState } from 'react';
import { X, ArrowRight, Wallet, Landmark } from 'lucide-react';
import { authService } from '../services/authService';

interface DepositTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const DepositTradeModal: React.FC<DepositTradeModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('16888'); // Default estimated rate
    const [loading, setLoading] = useState(false);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const depositAmount = parseFloat(amount);
            const conversionRate = parseFloat(rate);
            const convertedAmount = depositAmount * conversionRate;

            await authService.fetchWithAuth('/api/trading/deposit', {
                method: 'POST',
                body: JSON.stringify({
                    amount: depositAmount,
                    convertedAmount: convertedAmount
                })
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Deposit failed');
        } finally {
            setLoading(false);
        }
    };

    const estimatedIdrCost = (parseFloat(amount || '0') * parseFloat(rate || '0')) || 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#f4c025]/20 rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_-10px_rgba(244,192,37,0.1)] overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 dark:border-[#f4c025]/10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Deposit Funds</h2>
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] mt-1">Add funds to trading wallet</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-[#cbbc90] dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleDeposit} className="p-4 md:p-6 space-y-4 md:space-y-6">
                        {/* From -> To Visualization */}
                        <div className="bg-slate-50 dark:bg-[#1e1b10] rounded-xl p-4 border border-slate-200 dark:border-[#f4c025]/20 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#f4c025]/10 flex items-center justify-center text-slate-600 dark:text-[#f4c025]">
                                    <Landmark size={20} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider">From</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Main Balance</p>
                                </div>
                            </div>

                            <div className="text-slate-300 dark:text-[#cbbc90]/40 rotate-90 md:rotate-0">
                                <ArrowRight size={24} />
                            </div>

                            <div className="flex flex-col items-center space-y-2">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-[#f4c025]/10 flex items-center justify-center text-amber-600 dark:text-[#f4c025]">
                                    <Wallet size={20} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider">To</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Trading Wallet</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-center block text-sm text-slate-500 dark:text-[#cbbc90]">Enter Deposit Amount (USD)</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-light text-slate-300 dark:text-[#cbbc90]">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-transparent text-center text-4xl md:text-5xl font-bold text-slate-800 dark:text-white focus:outline-none placeholder-slate-200 dark:placeholder-[#cbbc90]/20 pb-2"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider block">Exchange Rate (1 USD = IDR)</label>
                            <input
                                type="number"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/20 rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 dark:focus:border-[#f4c025] transition-colors font-mono"
                            />
                            <div className="flex justify-between items-center bg-slate-100 dark:bg-[#f4c025]/5 p-3 rounded-lg border border-slate-200 dark:border-[#f4c025]/10">
                                <span className="text-xs text-slate-500 dark:text-[#cbbc90]">Estimated Cost:</span>
                                <span className="text-sm font-bold text-rose-500 dark:text-rose-400">- Rp {estimatedIdrCost.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-[#f4c025]/5 border border-amber-200 dark:border-[#f4c025]/20 rounded-lg p-4 flex items-start space-x-3">
                            <div className="min-w-5 pt-0.5">
                                <div className="w-5 h-5 rounded-full bg-amber-500 dark:bg-[#f4c025] flex items-center justify-center text-white dark:text-black font-bold text-xs">i</div>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-[#cbbc90] leading-relaxed">
                                <span className="font-bold text-slate-800 dark:text-white">Accounting Notice:</span> This will increase your Trading Wallet (USD) and record a corresponding 'Expense' transaction in your Main Dashboard.
                            </p>
                        </div>

                        <div className="grid grid-cols-1">
                            <button
                                type="submit"
                                disabled={loading || !amount || parseFloat(amount) <= 0}
                                className="flex items-center justify-center space-x-2 w-full py-3 md:py-4 rounded-xl bg-amber-500 dark:bg-[#f4c025] text-white dark:text-[#2b2616] font-bold text-base md:text-lg hover:bg-amber-600 dark:hover:bg-[#dca60e] transition-all transform hover:scale-[1.02] shadow-[0_4px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_-5px_rgba(244,192,37,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Wallet size={20} />
                                <span>Confirm Deposit</span>
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 text-sm text-slate-500 hover:text-slate-800 dark:text-[#cbbc90] dark:hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DepositTradeModal;
