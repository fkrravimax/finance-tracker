import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { authService } from '../services/authService';

interface LogTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
}

const LogTradeModal: React.FC<LogTradeModalProps> = ({ isOpen, onClose, onSave }) => {
    const [pair, setPair] = useState('BTC/USDT');
    const [type, setType] = useState<'LONG' | 'SHORT'>('LONG');
    const [leverage, setLeverage] = useState(20);
    const [amount, setAmount] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [closePrice, setClosePrice] = useState('');
    const [pnl, setPnl] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-calculate PnL guess (optional)
    // Auto-calculate PnL
    useEffect(() => {
        if (amount && entryPrice && closePrice && leverage) {
            const margin = parseFloat(amount);
            const entry = parseFloat(entryPrice);
            const close = parseFloat(closePrice);

            if (!isNaN(margin) && !isNaN(entry) && !isNaN(close) && entry > 0) {
                let percentage = 0;

                if (type === 'LONG') {
                    percentage = (close - entry) / entry;
                } else {
                    percentage = (entry - close) / entry;
                }

                const calculatedPnl = margin * leverage * percentage;
                setPnl(calculatedPnl.toFixed(2));
            }
        }
    }, [amount, entryPrice, closePrice, leverage, type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                pair,
                type,
                leverage,
                amount: parseFloat(amount),
                entryPrice: parseFloat(entryPrice),
                closePrice: parseFloat(closePrice),
                pnl: parseFloat(pnl),
                notes
            };

            await authService.fetchWithAuth('/api/trading', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to log trade');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#f4c025]/20 rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_-10px_rgba(244,192,37,0.1)] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#f4c025]/10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Log New Trade</h2>
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] mt-1">Enter your trade details to track performance.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-[#cbbc90] dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[80vh]">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider">Trading Pair</label>
                                <input
                                    type="text"
                                    value={pair}
                                    onChange={(e) => setPair(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/20 rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 dark:focus:border-[#f4c025] transition-colors font-mono"
                                    placeholder="BTC/USDT"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider">Position Side</label>
                                <div className="grid grid-cols-2 bg-slate-100 dark:bg-[#1e1b10] rounded-lg p-1 border border-slate-200 dark:border-[#f4c025]/20">
                                    <button
                                        type="button"
                                        onClick={() => setType('LONG')}
                                        className={`text-sm font-medium py-2 rounded-md transition-all ${type === 'LONG'
                                            ? 'bg-emerald-100 dark:bg-gradient-to-r dark:from-emerald-500/20 dark:to-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                            : 'text-slate-500 dark:text-[#cbbc90] hover:text-slate-800 dark:hover:text-white'
                                            }`}
                                    >
                                        ↗ Long
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('SHORT')}
                                        className={`text-sm font-medium py-2 rounded-md transition-all ${type === 'SHORT'
                                            ? 'bg-rose-100 dark:bg-gradient-to-r dark:from-rose-500/20 dark:to-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                            : 'text-slate-500 dark:text-[#cbbc90] hover:text-slate-800 dark:hover:text-white'
                                            }`}
                                    >
                                        ↘ Short
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider">Leverage</label>
                                <div className="flex items-center space-x-2">
                                    <span className="text-amber-600 dark:text-[#f4c025] font-bold text-lg">{leverage}x</span>
                                </div>
                            </div>
                            <div className="relative pt-2">
                                <input
                                    type="range"
                                    min="1"
                                    max="150"
                                    value={leverage}
                                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                                    className="w-full h-1 bg-slate-200 dark:bg-[#1e1b10] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 dark:[&::-webkit-slider-thumb]:bg-[#f4c025] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(244,192,37,0.5)]"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#cbbc90] mt-2">
                                    <span>1x</span>
                                    <span>50x</span>
                                    <span>100x</span>
                                    <span>150x</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider">Margin ($)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/20 rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 dark:focus:border-[#f4c025] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider">Entry Price ($)</label>
                                <input
                                    type="number"
                                    value={entryPrice}
                                    onChange={(e) => setEntryPrice(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/20 rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 dark:focus:border-[#f4c025] transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider">Close Price ($)</label>
                                <input
                                    type="number"
                                    value={closePrice}
                                    onChange={(e) => setClosePrice(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/20 rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 dark:focus:border-[#f4c025] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider">Realized PnL ($)</label>
                                <input
                                    type="number"
                                    value={pnl}
                                    onChange={(e) => setPnl(e.target.value)}
                                    className={`w-full bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/20 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-400 dark:focus:border-[#f4c025] transition-colors font-bold ${parseFloat(pnl) > 0 ? 'text-emerald-500 dark:text-emerald-400' : parseFloat(pnl) < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-white'
                                        }`}
                                    placeholder="+ 0.00"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/10 border-dashed rounded-lg p-3">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add Trade Notes..."
                                className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-[#cbbc90] resize-none focus:outline-none h-16"
                            />
                        </div>

                        <div className="pt-2 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-lg border border-slate-200 dark:border-[#f4c025]/30 text-slate-500 hover:text-slate-800 dark:text-[#f4c025] dark:hover:bg-[#f4c025]/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 rounded-lg bg-amber-500 dark:bg-[#f4c025] text-white dark:text-[#2b2616] font-bold hover:bg-amber-600 dark:hover:bg-[#dca60e] transition-all transform hover:scale-[1.02] shadow-[0_4px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_-5px_rgba(244,192,37,0.5)] disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Trade'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LogTradeModal;
