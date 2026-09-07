import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check, RotateCcw, FileText } from 'lucide-react';

export interface MandiriMutationItem {
    id: string;
    typeId: 'qr' | 'transfer';
    title: string;
    day: string;
    description: string;
    amount: number;
    cents: string;
    type: 'expense' | 'income';
}

export const DEFAULT_MANDIRI_MUTATIONS: MandiriMutationItem[] = [
    {
        id: 'm1',
        typeId: 'qr',
        title: 'QR Bayar',
        day: '05',
        description: 'Pembayaran QR\nke IDM QRIS LIVIN\n624827123587',
        amount: 75300,
        cents: '00',
        type: 'expense',
    },
    {
        id: 'm2',
        typeId: 'transfer',
        title: 'Transfer Rupiah',
        day: '05',
        description: 'Transfer BI Fast\nKe BANK BNI\nSUHENDRA WAHYU 1817362467',
        amount: 285000,
        cents: '00',
        type: 'expense',
    },
];

interface MandiriStatementModalProps {
    isOpen: boolean;
    onClose: () => void;
    mutations: MandiriMutationItem[];
    onSave: (newMutations: MandiriMutationItem[]) => void;
    selectedMonth?: string;
}

export const MandiriStatementModal: React.FC<MandiriStatementModalProps> = ({
    isOpen,
    onClose,
    mutations,
    onSave,
    selectedMonth = 'September',
}) => {
    const [draftList, setDraftList] = useState<MandiriMutationItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            setDraftList(
                mutations && mutations.length > 0
                    ? JSON.parse(JSON.stringify(mutations))
                    : JSON.parse(JSON.stringify(DEFAULT_MANDIRI_MUTATIONS))
            );
        }
    }, [isOpen, mutations]);

    if (!isOpen) return null;

    const handleUpdateItem = (index: number, updates: Partial<MandiriMutationItem>) => {
        setDraftList(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const handleTypeChange = (index: number, typeId: 'qr' | 'transfer') => {
        setDraftList(prev => {
            const next = [...prev];
            const curr = next[index];
            const isDefaultTitle = curr.title === 'QR Bayar' || curr.title === 'Transfer Rupiah' || !curr.title;
            next[index] = {
                ...curr,
                typeId,
                title: isDefaultTitle ? (typeId === 'qr' ? 'QR Bayar' : 'Transfer Rupiah') : curr.title,
            };
            return next;
        });
    };

    const handleAddItem = () => {
        const newId = 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
        const lastDay = draftList[draftList.length - 1]?.day || '05';
        const newItem: MandiriMutationItem = {
            id: newId,
            typeId: 'transfer',
            title: 'Transfer Rupiah',
            day: lastDay,
            description: 'Transfer BI Fast\nKe BANK BCA\nRAHMAD HIDAYAT 8920194820',
            amount: 150000,
            cents: '00',
            type: 'expense',
        };
        setDraftList(prev => [...prev, newItem]);
    };

    const handleRemoveItem = (index: number) => {
        if (draftList.length <= 1) return;
        setDraftList(prev => prev.filter((_, i) => i !== index));
    };

    const handleResetDefault = () => {
        setDraftList(JSON.parse(JSON.stringify(DEFAULT_MANDIRI_MUTATIONS)));
    };

    const handleSave = () => {
        onSave(draftList);
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#f8fafc] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#003d79] via-[#005ea6] to-[#0077d8] px-5 sm:px-6 py-4 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                <FileText className="w-5 h-5 text-yellow-300" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold leading-tight">Kustomisasi Mutasi Rekening</h2>
                                <p className="text-[11px] text-blue-100/90 mt-0.5">
                                    e-Statement Livin Mandiri • Bulan Aktif: {selectedMonth}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 transition-all text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Notice Banner */}
                    <div className="bg-blue-50/80 border-b border-blue-100/80 px-5 py-2.5 text-xs text-blue-800 shrink-0 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#007dfe] shrink-0" />
                        <span>
                            Gunakan tombol <strong>Enter</strong> di kolom rincian untuk membuat baris baru. Tanggal mutasi otomatis menyesuaikan tab bulan yang dipilih.
                        </span>
                    </div>

                    {/* Scrollable Mutation Cards List */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
                        {draftList.map((item, idx) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-4 space-y-3 relative transition-all"
                            >
                                {/* Card Header */}
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-[#007dfe]/10 text-[#007dfe] font-bold text-xs flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-700">
                                            Mutasi #{idx + 1}
                                        </span>
                                    </div>
                                    {draftList.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(idx)}
                                            className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 text-xs"
                                            title="Hapus mutasi ini"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Hapus</span>
                                        </button>
                                    )}
                                </div>

                                {/* Type Selector: QR Bayar vs Transfer Rupiah */}
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                                        Jenis Mutasi & Ikon
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Option QR Bayar */}
                                        <button
                                            type="button"
                                            onClick={() => handleTypeChange(idx, 'qr')}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                                                item.typeId === 'qr'
                                                    ? 'border-[#007dfe] bg-blue-50/60 ring-2 ring-[#007dfe]/20 font-semibold text-[#007dfe]'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                        >
                                            <img
                                                src="/clean-mode-mandiri/mandiri_mutasi_qr.png"
                                                alt="QR Bayar"
                                                className="w-7 h-7 object-contain shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold leading-tight">QR Bayar</div>
                                                <div className="text-[10px] text-gray-500">Ikon Kotak QR</div>
                                            </div>
                                        </button>

                                        {/* Option Transfer Rupiah */}
                                        <button
                                            type="button"
                                            onClick={() => handleTypeChange(idx, 'transfer')}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                                                item.typeId === 'transfer'
                                                    ? 'border-[#007dfe] bg-blue-50/60 ring-2 ring-[#007dfe]/20 font-semibold text-[#007dfe]'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                        >
                                            <img
                                                src="/clean-mode-mandiri/mandiri_mutasi_transfer.png"
                                                alt="Transfer Rupiah"
                                                className="w-7 h-7 object-contain shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold leading-tight">Transfer Rupiah</div>
                                                <div className="text-[10px] text-gray-500">Ikon Bulat Panah</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Row: Day & Title */}
                                <div className="grid grid-cols-3 gap-2.5">
                                    <div className="col-span-1">
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Tanggal (Hari)
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={2}
                                            value={item.day}
                                            onChange={e => handleUpdateItem(idx, { day: e.target.value.replace(/\D/g, '') })}
                                            placeholder="05"
                                            className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-[#007dfe] focus:bg-white"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Judul Mutasi
                                        </label>
                                        <input
                                            type="text"
                                            value={item.title}
                                            onChange={e => handleUpdateItem(idx, { title: e.target.value })}
                                            placeholder="QR Bayar / Transfer Rupiah"
                                            className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#007dfe] focus:bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Multiline Description with Enter Support */}
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center justify-between">
                                        <span>Rincian Informasi</span>
                                        <span className="text-[10px] font-normal text-blue-600">Tekan Enter untuk baris baru</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={item.description}
                                        onChange={e => handleUpdateItem(idx, { description: e.target.value })}
                                        placeholder={"Baris 1: Pembayaran QR\nBaris 2: ke IDM QRIS LIVIN\nBaris 3: 624827123587"}
                                        className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-lg text-xs text-gray-800 leading-relaxed font-normal focus:outline-none focus:ring-2 focus:ring-[#007dfe] focus:bg-white resize-y"
                                    />
                                </div>

                                {/* Nominal, Cents & Flow Type */}
                                <div className="grid grid-cols-12 gap-2 pt-1">
                                    {/* Type Toggle (+ / -) */}
                                    <div className="col-span-4">
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Arus Dana
                                        </label>
                                        <div className="flex rounded-lg border border-gray-200 overflow-hidden p-0.5 bg-gray-50/80">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateItem(idx, { type: 'expense' })}
                                                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-0.5 ${
                                                    item.type === 'expense'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-800'
                                                }`}
                                            >
                                                <span>- Keluar</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateItem(idx, { type: 'income' })}
                                                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-0.5 ${
                                                    item.type === 'income'
                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-800'
                                                }`}
                                            >
                                                <span>+ Masuk</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Amount Input */}
                                    <div className="col-span-5">
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Nominal (Rp)
                                        </label>
                                        <input
                                            type="text"
                                            value={item.amount ? item.amount.toLocaleString('id-ID') : ''}
                                            onChange={e => {
                                                const numeric = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                                                handleUpdateItem(idx, { amount: numeric });
                                            }}
                                            placeholder="75.300"
                                            className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#007dfe] focus:bg-white text-right"
                                        />
                                    </div>

                                    {/* Cents Input */}
                                    <div className="col-span-3">
                                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                            Sen
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={2}
                                            value={item.cents}
                                            onChange={e => handleUpdateItem(idx, { cents: e.target.value.replace(/\D/g, '') })}
                                            placeholder="00"
                                            className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#007dfe] focus:bg-white text-center"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Mutation Button */}
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="w-full py-3.5 border-2 border-dashed border-[#007dfe]/40 hover:border-[#007dfe] bg-blue-50/40 hover:bg-blue-50/80 rounded-xl text-xs font-bold text-[#007dfe] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Mutasi Baru</span>
                        </button>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white border-t border-gray-200 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={handleResetDefault}
                            className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                            <span>Reset Template</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-5 py-2 bg-[#007dfe] hover:bg-[#006bd1] active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                            >
                                <Check className="w-4 h-4" />
                                <span>Simpan Perubahan</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MandiriStatementModal;
