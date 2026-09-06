import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownLeft, ArrowUpRight, Search, Calendar, Copy, Check } from 'lucide-react';
import { transactionService } from '../../services/transactionService';

interface BcaStatementModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountNumber: string;
    accountName: string;
    currentBalance: number;
}

interface TransactionItem {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
}

const MOCK_BCA_TRANSACTIONS: TransactionItem[] = [
    { id: '1', date: new Date().toISOString(), description: 'QRIS STARBUCKS COFFEE', amount: 58000, type: 'expense' },
    { id: '2', date: new Date(Date.now() - 86400000).toISOString(), description: 'TRSF E-BANKING CR DARI SALDO', amount: 2500000, type: 'income' },
    { id: '3', date: new Date(Date.now() - 172800000).toISOString(), description: 'QRIS INDOMARET POINT', amount: 42500, type: 'expense' },
    { id: '4', date: new Date(Date.now() - 259200000).toISOString(), description: 'PEMBAYARAN QRIS GOJEK', amount: 35000, type: 'expense' },
    { id: '5', date: new Date(Date.now() - 345600000).toISOString(), description: 'BIAYA ADM REKENING', amount: 15000, type: 'expense' },
    { id: '6', date: new Date(Date.now() - 432000000).toISOString(), description: 'TRSF E-BANKING CR GAJI / TRANSFER', amount: 15000000, type: 'income' },
];

export const BcaStatementModal: React.FC<BcaStatementModalProps> = ({
    isOpen,
    onClose,
    accountNumber,
    accountName,
    currentBalance,
}) => {
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const realData = await transactionService.getAll({ month: now.getMonth(), year: now.getFullYear() });

                if (realData && realData.length > 0) {
                    const mapped: TransactionItem[] = realData.map((t: any) => ({
                        id: t.id,
                        date: t.date,
                        description: (t.merchant ? `${t.merchant.toUpperCase()}` : 'TRANSAKSI') + (t.category ? ` - ${t.category.toUpperCase()}` : ''),
                        amount: Number(t.amount) || 0,
                        type: t.type === 'income' ? 'income' : 'expense'
                    }));
                    setTransactions(mapped);
                } else {
                    setTransactions(MOCK_BCA_TRANSACTIONS);
                }
            } catch (err) {
                console.warn('Using mock BCA statement transactions fallback:', err);
                setTransactions(MOCK_BCA_TRANSACTIONS);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(accountNumber.replace(/\s|-/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (isoString: string) => {
        const d = new Date(isoString);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month} ${hours}:${mins}`;
    };

    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    };

    const filtered = transactions.filter(t => {
        if (filterType === 'income' && t.type !== 'income') return false;
        if (filterType === 'expense' && t.type !== 'expense') return false;
        if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="w-full sm:max-w-md bg-[#f4f8fc] rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                >
                    {/* Header Bar */}
                    <div className="bg-[#005caa] text-white px-5 py-4 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                                <img src="/clean-mode/icon_account_trans.png" alt="Statement" className="w-5 h-5 object-contain invert brightness-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base leading-tight">Mutasi Rekening</h3>
                                <p className="text-[11px] text-blue-200 font-medium">Account Statement</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Account Info Strip */}
                    <div className="bg-gradient-to-r from-[#0c5796] to-[#003875] text-white px-5 py-3 border-b border-blue-400/20">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-blue-200 font-medium uppercase tracking-wider">{accountName}</span>
                            <div className="flex items-center gap-1.5 cursor-pointer" onClick={handleCopy}>
                                <span className="font-mono text-white/90">{accountNumber}</span>
                                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-blue-200" />}
                            </div>
                        </div>
                        <div className="mt-1.5 flex justify-between items-baseline">
                            <span className="text-[11px] text-blue-200">Saldo Akhir:</span>
                            <span className="text-sm font-bold tracking-tight text-white">IDR {formatRupiah(currentBalance)}</span>
                        </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div className="p-4 bg-white border-b border-slate-200 flex flex-col gap-2.5">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari transaksi..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-slate-800 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#005caa]"
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${filterType === 'all' ? 'bg-[#005caa] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setFilterType('income')}
                                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${filterType === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Uang Masuk (CR)
                            </button>
                            <button
                                onClick={() => setFilterType('expense')}
                                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${filterType === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Uang Keluar (DB)
                            </button>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                <span className="w-6 h-6 border-2 border-[#005caa]/30 border-t-[#005caa] rounded-full animate-spin" />
                                <span className="text-xs font-medium">Memuat data mutasi...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                <Calendar className="w-8 h-8 text-slate-300 stroke-1" />
                                <span className="text-xs font-medium">Tidak ada transaksi ditemukan</span>
                            </div>
                        ) : (
                            filtered.map(item => (
                                <div key={item.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {item.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-1">{item.description}</p>
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(item.date)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-xs font-bold font-mono ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {item.type === 'income' ? '+' : '-'} {formatRupiah(item.amount)}
                                        </p>
                                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${item.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {item.type === 'income' ? 'CR' : 'DB'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Bottom Status note */}
                    <div className="bg-slate-100 px-4 py-2.5 text-center border-t border-slate-200">
                        <p className="text-[10px] text-slate-500 font-medium">
                            PT Bank Central Asia Tbk berizin dan diawasi oleh OJK & BI
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
export default BcaStatementModal;
