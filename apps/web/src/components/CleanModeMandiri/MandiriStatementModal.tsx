import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownLeft, ArrowUpRight, Search, Calendar, Copy, Check, FileText } from 'lucide-react';
import { transactionService } from '../../services/transactionService';

interface MandiriStatementModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountNumber: string;
    accountName: string;
    currentBalance: number;
    selectedMonth?: string;
}

interface StatementItem {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
}

const DEFAULT_MANDIRI_STATEMENTS: StatementItem[] = [
    { id: '1', date: '2026-09-05T10:15:00', description: 'PEMBAYARAN QR KE IDM QRIS LIVIN 624827123587', amount: 75300, type: 'expense', category: 'QR Bayar' },
    { id: '2', date: '2026-09-05T08:42:00', description: 'TRANSFER BI FAST KE BANK BNI SUHENDRA WAHYU 1817362467', amount: 285000, type: 'expense', category: 'Transfer Rupiah' },
    { id: '3', date: '2026-09-05T08:42:00', description: 'BIAYA TRANSFER BI FAST', amount: 2500, type: 'expense', category: 'Biaya' },
    { id: '4', date: '2026-09-04T19:20:00', description: 'TRANSFER BI FAST KE BCA RANO 7245614730', amount: 1700000, type: 'expense', category: 'Transfer Rupiah' },
    { id: '5', date: '2026-09-04T19:20:00', description: 'BIAYA TRANSFER BI FAST', amount: 2500, type: 'expense', category: 'Biaya' },
    { id: '6', date: '2026-09-01T09:00:00', description: 'PAYROLL SALARY CREDIT PT MANDIRI CORP', amount: 35000000, type: 'income', category: 'Transfer Rupiah' },
];

export const MandiriStatementModal: React.FC<MandiriStatementModalProps> = ({
    isOpen,
    onClose,
    accountNumber,
    accountName,
    currentBalance,
    selectedMonth = 'September 2026',
}) => {
    const [transactions, setTransactions] = useState<StatementItem[]>(DEFAULT_MANDIRI_STATEMENTS);
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const loadRealData = async () => {
            try {
                const now = new Date();
                const realData = await transactionService.getAll({ month: now.getMonth(), year: now.getFullYear() });
                if (realData && realData.length > 0) {
                    const mapped: StatementItem[] = realData.map((t: any) => ({
                        id: t.id,
                        date: t.date,
                        description: (t.merchant ? `${t.merchant.toUpperCase()}` : 'TRANSAKSI') + (t.category ? ` - ${t.category.toUpperCase()}` : ''),
                        amount: Number(t.amount) || 0,
                        type: t.type === 'income' ? 'income' : 'expense',
                        category: t.category,
                    }));
                    // Blend real data with default Mandiri payroll transactions
                    setTransactions([...DEFAULT_MANDIRI_STATEMENTS.slice(0, 3), ...mapped]);
                }
            } catch (err) {
                console.error('Error fetching transactions for e-Statement:', err);
                setTransactions(DEFAULT_MANDIRI_STATEMENTS);
            }
        };

        loadRealData();
    }, [isOpen]);

    const filtered = transactions.filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const handleCopyAccount = () => {
        navigator.clipboard.writeText(accountNumber.replace(/\D/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatIdr = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val).replace('IDR', 'Rp');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#f8fafc] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
                    >
                        {/* Header Livin' Mandiri */}
                        <div className="bg-gradient-to-r from-[#003d79] via-[#005ea6] to-[#0077d8] px-6 py-5 text-white relative">
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                    <FileText className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold tracking-widest text-yellow-300 uppercase">
                                        Livin' by Mandiri
                                    </span>
                                    <h2 className="text-xl font-bold leading-tight">e-Statement Tabungan</h2>
                                </div>
                            </div>
                            <p className="text-xs text-blue-100/90 flex items-center gap-1.5 mt-1">
                                <Calendar className="w-3.5 h-3.5 text-yellow-300" />
                                Periode: {selectedMonth}
                            </p>
                        </div>

                        {/* Account Summary Banner */}
                        <div className="bg-white p-5 border-b border-gray-200/80">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Nomor Rekening</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="font-mono text-base font-bold text-gray-800">
                                            {accountNumber}
                                        </span>
                                        <button
                                            onClick={handleCopyAccount}
                                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                            title="Salin Nomor Rekening"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="text-xs font-semibold text-gray-700 mt-0.5">{accountName}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 font-medium">Saldo Akhir</div>
                                    <div className="text-base font-bold text-[#005ea6] mt-0.5">
                                        {formatIdr(currentBalance)}
                                    </div>
                                </div>
                            </div>

                            {/* Mutation Totals */}
                            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100">
                                <div className="bg-emerald-50/70 border border-emerald-100/80 p-2.5 rounded-xl">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                        <ArrowDownLeft className="w-3.5 h-3.5" /> Total Kredit (Masuk)
                                    </div>
                                    <div className="text-sm font-bold text-emerald-800 mt-1">
                                        {formatIdr(totalIncome)}
                                    </div>
                                </div>
                                <div className="bg-rose-50/70 border border-rose-100/80 p-2.5 rounded-xl">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                                        <ArrowUpRight className="w-3.5 h-3.5" /> Total Debit (Keluar)
                                    </div>
                                    <div className="text-sm font-bold text-rose-800 mt-1">
                                        {formatIdr(totalExpense)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search & Filter Controls */}
                        <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari transaksi e-Statement..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0077d8] focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterType('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        filterType === 'all'
                                            ? 'bg-[#0077d8] text-white shadow-sm'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                >
                                    Semua ({transactions.length})
                                </button>
                                <button
                                    onClick={() => setFilterType('income')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                                        filterType === 'income'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                                    }`}
                                >
                                    <ArrowDownLeft className="w-3 h-3" /> Kredit
                                </button>
                                <button
                                    onClick={() => setFilterType('expense')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                                        filterType === 'expense'
                                            ? 'bg-rose-600 text-white shadow-sm'
                                            : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                                    }`}
                                >
                                    <ArrowUpRight className="w-3 h-3" /> Debit
                                </button>
                            </div>
                        </div>

                        {/* Mutation Feed */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                            {filtered.length === 0 ? (
                                <div className="text-center py-10">
                                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-500">Tidak ada transaksi ditemukan</p>
                                </div>
                            ) : (
                                filtered.map(t => (
                                    <div
                                        key={t.id}
                                        className="bg-white p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 shadow-sm flex items-center justify-between gap-3 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                                    t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}
                                            >
                                                {t.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-800 line-clamp-1">{t.description}</div>
                                                <div className="text-[11px] text-gray-400 mt-0.5">
                                                    {new Date(t.date).toLocaleDateString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`text-xs font-bold text-right shrink-0 ${
                                                t.type === 'income' ? 'text-emerald-600' : 'text-gray-900'
                                            }`}
                                        >
                                            {t.type === 'income' ? '+' : '-'} {formatIdr(t.amount)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
                            <div className="text-[11px] text-gray-400">
                                Dicetak langsung dari Livin' by Mandiri
                            </div>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl bg-[#0077d8] hover:bg-[#005ea6] text-white text-xs font-bold transition-colors shadow-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MandiriStatementModal;
