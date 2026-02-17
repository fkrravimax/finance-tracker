
import React, { useState } from 'react';
import { transactionService } from '../services/transactionService';
import CurrencyInput from './CurrencyInput';
import { useNotification } from '../contexts/NotificationContext';

interface InitialBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

type WalletType = 'Bank' | 'Cash' | 'E-wallet';

const InitialBalanceModal: React.FC<InitialBalanceModalProps> = ({ isOpen, onClose, onComplete }) => {
    const { showNotification } = useNotification();
    const [amount, setAmount] = useState('');
    const [walletType, setWalletType] = useState<WalletType>('Bank');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Find or Create Wallet
            // We need a wallet to attach this balance to, otherwise the "Total Balance" won't update.
            // Fetch existing wallets first.
            let targetWalletId = null;

            // Note: We need to import 'api' to fetch wallets. 
            // Since we can't easily add import at top without potentially messing up lines if not careful with line numbers,
            // we will use the 'transactionService' or 'dashboardService' if they have it, OR just use 'fetch' or assume 'api' is available globally (it's not).
            // Actually, best to add 'import api from "../services/api";' at the top.
            // For now, let's assume we can use the 'api' instance if we impot it. 
            // I will add the import in a separate block if needed, but for now let's write the logic.
            // Wait, I can't add import here. I should do it in a separate call or use 'require'? No, ES modules.
            // I'll add the logic assuming 'api' is imported, and then I'll add the import line.

            const { data: wallets } = await import('../services/api').then(m => m.default.get('/wallets'));

            const existingWallet = wallets.find((w: any) => w.type === walletType.toUpperCase() || w.name.includes(walletType));

            if (existingWallet) {
                targetWalletId = existingWallet.id;
            } else {
                // Create new wallet
                const { data: newWallet } = await import('../services/api').then(m => m.default.post('/wallets', {
                    name: `${walletType} Wallet`,
                    type: walletType.toUpperCase() // BANK, CASH, E_WALLET usually
                }));
                targetWalletId = newWallet.id;
            }

            // 2. Create Transaction with walletId
            await transactionService.create({
                amount: Number(amount),
                type: 'income',
                category: 'Income',
                merchant: 'Initial Balance',
                description: `${walletType} Balance`,
                date: new Date().toISOString(),
                walletId: targetWalletId, // Attach to wallet!
                icon: walletType === 'Bank' ? 'account_balance' : walletType === 'Cash' ? 'payments' : 'account_balance_wallet'
            });

            // 3. Force refresh of dashboard
            onComplete();
            onClose();
        } catch (error) {
            console.error("Failed to set initial balance", error);
            showNotification("Failed to set initial balance", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#2a2515] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-[#493f22]">
                <div className="text-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-green-500 mb-2">account_balance_wallet</span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Let's Get Started!</h2>
                    <p className="text-slate-500 dark:text-[#cbbc90]">Enter your current balance for your main wallet.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90] mb-1 block">Current Balance (Rp)</label>
                        <CurrencyInput
                            value={amount}
                            onChange={(val) => setAmount(val.toString())}
                            placeholder="e.g. 5.000.000"
                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90] mb-1 block">Wallet Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Bank', 'Cash', 'E-wallet'] as WalletType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setWalletType(type)}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${walletType === type
                                        ? 'bg-primary text-slate-900 border-primary shadow-lg scale-105'
                                        : 'bg-white dark:bg-[#1a160b] text-slate-500 dark:text-[#cbbc90] border-slate-200 dark:border-[#493f22] hover:bg-slate-50 dark:hover:bg-[#36301d]'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/25 active:scale-95 disabled:opacity-70 mt-4"
                    >
                        {loading ? 'Saving...' : 'Set Balance'}
                    </button>

                    <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        Skip / I have 0 balance
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InitialBalanceModal;
