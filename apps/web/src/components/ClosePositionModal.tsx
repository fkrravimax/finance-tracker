import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { authService } from '../services/authService';

interface Trade {
    id: string;
    pair: string;
    type: string;
    amount: number;
    entryPrice: number;
    leverage: number;
}

interface ClosePositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
    trade: Trade | null;
}

const ClosePositionModal: React.FC<ClosePositionModalProps> = ({ isOpen, onClose, onSave, trade }) => {
    const [closePrice, setClosePrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [calculatedPnl, setCalculatedPnl] = useState(0);

    // Auto-calculate PnL when closePrice changes
    useEffect(() => {
        if (!trade || !closePrice) {
            setCalculatedPnl(0);
            return;
        }
        const close = parseFloat(closePrice);
        if (isNaN(close) || close <= 0) {
            setCalculatedPnl(0);
            return;
        }

        let percentage = 0;
        if (trade.type === 'LONG') {
            percentage = (close - trade.entryPrice) / trade.entryPrice;
        } else {
            percentage = (trade.entryPrice - close) / trade.entryPrice;
        }
        setCalculatedPnl(trade.amount * trade.leverage * percentage);
    }, [closePrice, trade]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trade) return;
        setLoading(true);

        try {
            await authService.fetchWithAuth(`/api/trading/${trade.id}/close`, {
                method: 'PUT',
                body: JSON.stringify({ closePrice: parseFloat(closePrice) })
            });

            if (onSave) onSave();
            onClose();
            setClosePrice('');
        } catch (error) {
            console.error(error);
            alert('Failed to close position');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !trade) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#f4c025]/20 rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_-10px_rgba(244,192,37,0.1)] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#f4c025]/10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Close Position</h2>
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] mt-1">Enter the close price to finalize this trade.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-[#cbbc90] dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Position Summary */}
                    <div className="bg-slate-50 dark:bg-[#1e1b10] rounded-xl p-4 border border-slate-200 dark:border-[#f4c025]/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-slate-800 dark:text-white">{trade.pair}</span>
                            <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold border ${trade.type === 'LONG'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                }`}>
                                {trade.type}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <p className="text-[10px] text-slate-400 dark:text-[#cbbc90] uppercase">Entry</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-white">${trade.entryPrice.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 dark:text-[#cbbc90] uppercase">Margin</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-white">${trade.amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 dark:text-[#cbbc90] uppercase">Leverage</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-white">{trade.leverage}x</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Close Price Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider">Close Price ($)</label>
                            <input
                                type="number"
                                step="any"
                                value={closePrice}
                                onChange={(e) => setClosePrice(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/20 rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 dark:focus:border-[#f4c025] transition-colors text-lg font-mono"
                                placeholder="0.00"
                                required
                                autoFocus
                            />
                        </div>

                        {/* PnL Preview */}
                        {closePrice && (
                            <div className={`rounded-xl p-4 border ${calculatedPnl >= 0
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                                }`}>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Estimated PnL</p>
                                <p className={`text-2xl font-bold ${calculatedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {calculatedPnl >= 0 ? '+' : ''}${calculatedPnl.toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                    ROI: {((calculatedPnl / trade.amount) * 100).toFixed(2)}%
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-lg border border-slate-200 dark:border-[#f4c025]/30 text-slate-500 hover:text-slate-800 dark:text-[#f4c025] dark:hover:bg-[#f4c025]/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !closePrice}
                                className="px-6 py-3 rounded-lg bg-amber-500 dark:bg-[#f4c025] text-white dark:text-[#2b2616] font-bold hover:bg-amber-600 dark:hover:bg-[#dca60e] transition-all transform hover:scale-[1.02] shadow-[0_4px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_-5px_rgba(244,192,37,0.5)] disabled:opacity-50"
                            >
                                {loading ? 'Closing...' : 'Close Position'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClosePositionModal;
