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
    useEffect(() => {
        if (amount && entryPrice && closePrice && leverage) {
            const m = parseFloat(amount);
            const e = parseFloat(entryPrice);
            const c = parseFloat(closePrice);
            // const Lev = leverage;

            if (!isNaN(m) && !isNaN(e) && !isNaN(c)) {
                // (Exit - Entry) / Entry * Margin * Leverage
                // Logic kept for future reference or auto-fill feature
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
            <div className="w-full max-w-lg bg-[#2b2616] border border-[#f4c025]/20 rounded-2xl shadow-[0_0_40px_-10px_rgba(244,192,37,0.1)] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-[#f4c025]/10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Log New Trade</h2>
                        <p className="text-xs text-[#cbbc90] mt-1">Enter your trade details to track performance.</p>
                    </div>
                    <button onClick={onClose} className="text-[#cbbc90] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#cbbc90] uppercase tracking-wider">Trading Pair</label>
                            <input
                                type="text"
                                value={pair}
                                onChange={(e) => setPair(e.target.value)}
                                className="w-full bg-[#1e1b10] border border-[#f4c025]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#f4c025] transition-colors font-mono"
                                placeholder="BTC/USDT"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#cbbc90] uppercase tracking-wider">Position Side</label>
                            <div className="grid grid-cols-2 bg-[#1e1b10] rounded-lg p-1 border border-[#f4c025]/20">
                                <button
                                    type="button"
                                    onClick={() => setType('LONG')}
                                    className={`text-sm font-medium py-2 rounded-md transition-all ${type === 'LONG'
                                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                        : 'text-[#cbbc90] hover:text-white'
                                        }`}
                                >
                                    ↗ Long
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('SHORT')}
                                    className={`text-sm font-medium py-2 rounded-md transition-all ${type === 'SHORT'
                                        ? 'bg-gradient-to-r from-rose-500/20 to-rose-500/10 text-rose-400 border border-rose-500/30'
                                        : 'text-[#cbbc90] hover:text-white'
                                        }`}
                                >
                                    ↘ Short
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-[#cbbc90] uppercase tracking-wider">Leverage</label>
                            <div className="flex items-center space-x-2">
                                <span className="text-[#f4c025] font-bold text-lg">{leverage}x</span>
                            </div>
                        </div>
                        <div className="relative pt-2">
                            <input
                                type="range"
                                min="1"
                                max="150"
                                value={leverage}
                                onChange={(e) => setLeverage(parseInt(e.target.value))}
                                className="w-full h-1 bg-[#1e1b10] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#f4c025] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(244,192,37,0.5)]"
                            />
                            <div className="flex justify-between text-[10px] text-[#cbbc90] mt-2">
                                <span>1x</span>
                                <span>50x</span>
                                <span>100x</span>
                                <span>150x</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#cbbc90] uppercase tracking-wider">Margin ($)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#1e1b10] border border-[#f4c025]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
                                placeholder="1000.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#cbbc90] uppercase tracking-wider">Entry Price ($)</label>
                            <input
                                type="number"
                                value={entryPrice}
                                onChange={(e) => setEntryPrice(e.target.value)}
                                className="w-full bg-[#1e1b10] border border-[#f4c025]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
                                placeholder="25430.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#cbbc90] uppercase tracking-wider">Close Price ($)</label>
                            <input
                                type="number"
                                value={closePrice}
                                onChange={(e) => setClosePrice(e.target.value)}
                                className="w-full bg-[#1e1b10] border border-[#f4c025]/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
                                placeholder="26100.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#cbbc90] uppercase tracking-wider">Realized PnL ($)</label>
                            <input
                                type="number"
                                value={pnl}
                                onChange={(e) => setPnl(e.target.value)}
                                className={`w-full bg-[#1e1b10] border border-[#f4c025]/20 rounded-lg px-4 py-3 focus:outline-none focus:border-[#f4c025] transition-colors font-bold ${parseFloat(pnl) > 0 ? 'text-emerald-400' : parseFloat(pnl) < 0 ? 'text-rose-400' : 'text-white'
                                    }`}
                                placeholder="+ 0.00"
                            />
                        </div>
                    </div>

                    <div className="bg-[#1e1b10] border border-[#f4c025]/10 border-dashed rounded-lg p-3">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add Trade Notes..."
                            className="w-full bg-transparent text-sm text-white placeholder-[#cbbc90] resize-none focus:outline-none h-16"
                        />
                    </div>

                    <div className="pt-2 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-lg border border-[#f4c025]/30 text-[#f4c025] hover:bg-[#f4c025]/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 rounded-lg bg-[#f4c025] text-[#2b2616] font-bold hover:bg-[#dca60e] transition-all transform hover:scale-[1.02] shadow-[0_0_20px_-5px_rgba(244,192,37,0.5)] disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Trade'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LogTradeModal;
