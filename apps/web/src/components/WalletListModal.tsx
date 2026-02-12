
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import HiddenAmount from './HiddenAmount';

interface Wallet {
    id: string;
    name: string;
    type: string;
    balance: number;
}

interface WalletListModalProps {
    isOpen: boolean;
    onClose: () => void;
    wallets: Wallet[];
    onAddWallet: (name: string, type: string) => Promise<void>;
}

const WalletListModal: React.FC<WalletListModalProps> = ({ isOpen, onClose, wallets, onAddWallet }) => {
    // const { t } = useLanguage(); // Removed unused
    const [isAdding, setIsAdding] = useState(false);
    const [newWalletName, setNewWalletName] = useState('');
    const [newWalletType, setNewWalletType] = useState('BANK');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleAdd = async () => {
        if (!newWalletName) return;
        setIsLoading(true);
        try {
            await onAddWallet(newWalletName, newWalletType);
            setIsAdding(false);
            setNewWalletName('');
            setNewWalletType('BANK');
        } catch (error) {
            console.error("Failed to add wallet", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'BANK': return 'account_balance';
            case 'CASH': return 'payments';
            case 'E_WALLET': return 'account_balance_wallet';
            default: return 'wallet';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">My Wallets</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                    {wallets.map(wallet => (
                        <div key={wallet.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined">{getIcon(wallet.type)}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{wallet.name}</p>
                                    <p className="text-xs text-slate-500">{wallet.type}</p>
                                </div>
                            </div>
                            <div className="font-black text-slate-800 dark:text-white">
                                <HiddenAmount value={wallet.balance} prefix="Rp " className="text-base" />
                            </div>
                        </div>
                    ))}

                    {isAdding ? (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Wallet Name (e.g. BCA, Gopay)"
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={newWalletName}
                                onChange={e => setNewWalletName(e.target.value)}
                            />
                            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                                {['BANK', 'CASH', 'E_WALLET'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setNewWalletType(type)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${newWalletType === type ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAdd}
                                    disabled={isLoading || !newWalletName}
                                    className="flex-1 bg-primary text-white py-2 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50"
                                >
                                    {isLoading ? 'Adding...' : 'Save Wallet'}
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-sm hover:bg-slate-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-500 font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            Add New Wallet
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletListModal;
