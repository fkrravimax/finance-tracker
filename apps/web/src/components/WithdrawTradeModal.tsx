import React, { useState } from 'react';
import { X, ArrowRight, Wallet, Landmark } from 'lucide-react';
import { authService } from '../services/authService';

interface WithdrawTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    maxAmount: number;
    onSuccess?: () => void;
}

const WithdrawTradeModal: React.FC<WithdrawTradeModalProps> = ({ isOpen, onClose, maxAmount, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.fetchWithAuth('/api/trading/withdraw', {
                method: 'POST',
                body: JSON.stringify({ amount: parseFloat(amount) })
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Withdraw failed');
        } finally {
            setLoading(false);
        }
    };

    const handleMax = () => {
        setAmount(maxAmount.toFixed(2));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#2b2616] border border-[#f4c025]/20 rounded-2xl shadow-[0_0_40px_-10px_rgba(244,192,37,0.1)] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-[#f4c025]/10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
                        <p className="text-xs text-[#cbbc90] mt-1">Secure transfer to main balance</p>
                    </div>
                    <button onClick={onClose} className="text-[#cbbc90] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleWithdraw} className="p-6 space-y-8">
                    {/* From -> To Visualization */}
                    <div className="bg-[#1e1b10] rounded-xl p-4 border border-[#f4c025]/20 flex items-center justify-between">
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-[#f4c025]/10 flex items-center justify-center text-[#f4c025]">
                                <Wallet size={20} />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-[#cbbc90] uppercase tracking-wider">From</p>
                                <p className="text-sm font-bold text-white">Trading Wallet</p>
                            </div>
                        </div>

                        <div className="text-[#cbbc90]/40">
                            <ArrowRight size={24} />
                        </div>

                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-[#f4c025]/10 flex items-center justify-center text-[#f4c025]">
                                <Landmark size={20} />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-[#cbbc90] uppercase tracking-wider">To</p>
                                <p className="text-sm font-bold text-white">Main Balance</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-center block text-sm text-[#cbbc90]">Enter Withdrawal Amount</label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-light text-[#cbbc90]">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-transparent text-center text-5xl font-bold text-white focus:outline-none placeholder-[#cbbc90]/20 pb-2"
                            />
                        </div>
                        <div className="flex justify-center">
                            <div className="inline-flex items-center space-x-2 bg-[#1e1b10] px-3 py-1 rounded-full border border-[#f4c025]/20">
                                <span className="text-xs text-[#cbbc90]">Max Withdrawable: <span className="text-white font-bold ml-1">${maxAmount.toLocaleString()}</span></span>
                                <button type="button" onClick={handleMax} className="text-[10px] bg-[#f4c025]/20 text-[#f4c025] px-2 py-0.5 rounded hover:bg-[#f4c025]/30 transition-colors">MAX</button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#f4c025]/5 border border-[#f4c025]/20 rounded-lg p-4 flex items-start space-x-3">
                        <div className="min-w-5 pt-0.5">
                            <div className="w-5 h-5 rounded-full bg-[#f4c025] flex items-center justify-center text-black font-bold text-xs">i</div>
                        </div>
                        <p className="text-xs text-[#cbbc90] leading-relaxed">
                            <span className="font-bold text-white">Accounting Notice:</span> Funds will be instantly available. This withdrawal will be recorded as 'Income' for tax estimation purposes in your main finance dashboard.
                        </p>
                    </div>

                    <div className="grid grid-cols-1">
                        <button
                            type="submit"
                            disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
                            className="flex items-center justify-center space-x-2 w-full py-4 rounded-xl bg-[#f4c025] text-[#2b2616] font-bold text-lg hover:bg-[#dca60e] transition-all transform hover:scale-[1.02] shadow-[0_0_20px_-5px_rgba(244,192,37,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Landmark size={20} />
                            <span>Confirm Withdrawal</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 text-sm text-[#cbbc90] hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WithdrawTradeModal;
