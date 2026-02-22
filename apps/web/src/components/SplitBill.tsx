import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSplitBill } from '../hooks/useSplitBill';
import * as htmlToImage from 'html-to-image';
import { formatIDR } from '../services/dashboardService';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown, Receipt, Users, PlusCircle, Calculator } from 'lucide-react';

const SplitBill: React.FC = () => {
    const { t } = useLanguage();
    const splitState = useSplitBill();
    const resultRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newParticipant, setNewParticipant] = useState('');

    const navigate = useNavigate();
    const [user] = useState(authService.getCurrentUser());
    const isPremium = user?.plan?.toLowerCase() === 'platinum' || user?.role === 'ADMIN';

    // --- Format Helper ---
    const formatRp = (value: number) => formatIDR(value);

    // --- STEP 1: CAPTURE ---
    const renderStep1Capture = () => {
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                splitState.processImage(e.target.files[0]);
            }
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-12 px-4"
            >
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-glow">
                    <span className="material-symbols-outlined text-4xl">document_scanner</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('splitBill.captureTitle') || 'Scan Receipt'}</h2>
                <p className="text-slate-500 dark:text-text-muted text-center max-w-sm mb-8">
                    {t('splitBill.captureDesc') || 'Upload or take a photo of your receipt to automatically extract items and prices.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 btn-primary py-4 rounded-xl flex items-center justify-center gap-2 text-lg font-bold"
                        disabled={splitState.isProcessingIndicator}
                    >
                        <span className="material-symbols-outlined">photo_camera</span>
                        {t('splitBill.takePhoto') || 'Camera / Gallery'}
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {splitState.isProcessingIndicator && (
                    <div className="mt-8 w-full max-w-md bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-700 dark:text-slate-300 font-medium">{t('splitBill.processing') || 'Processing Image...'}</p>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-300"
                                    style={{ width: `${splitState.processingProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {splitState.error && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 w-full max-w-md">
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm font-medium">{splitState.error}</p>
                    </div>
                )}
            </motion.div>
        );
    };

    // --- STEP 2: REVIEW ---
    const renderStep2Review = () => {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row gap-6 w-full"
            >
                {/* Left: Image Preview (Desktop: Side, Mobile: Top/Hidden/Collapsible) */}
                <div className="hidden lg:block lg:w-1/3 bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-hidden shadow-inner sticky top-6 self-start max-h-[80vh]">
                    {splitState.receiptImageEnhanced && (
                        <img src={splitState.receiptImageEnhanced} alt="Receipt Preview" className="w-full h-auto object-contain" />
                    )}
                </div>

                {/* Right: Editable Table */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-soft border border-slate-100 dark:border-white/5 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('splitBill.reviewTitle') || 'Review Items'}</h3>
                            <p className="text-sm text-slate-500 dark:text-text-muted">{t('splitBill.reviewDesc') || 'Correct any mistakes from the AI scan.'}</p>
                        </div>
                        <button onClick={splitState.addReceiptItem} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span className="hidden sm:inline">{t('common.add') || 'Add Row'}</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                        <table className="w-full min-w-[500px] border-collapse">
                            <thead>
                                <tr className="text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                                    <th className="pb-3 pr-4">{t('splitBill.itemName') || 'Item Name'}</th>
                                    <th className="pb-3 px-2 w-20 text-center">Qty</th>
                                    <th className="pb-3 px-2 text-right">{t('splitBill.price') || 'Price'}</th>
                                    <th className="pb-3 pl-2 text-right">{t('splitBill.total') || 'Total'}</th>
                                    <th className="pb-3 pl-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {splitState.receiptData.items.map((item) => (
                                    <tr key={item.id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="py-2 pr-4">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => splitState.updateReceiptItem(item.id, 'name', e.target.value)}
                                                className="w-full bg-transparent border-0 focus:ring-1 focus:ring-primary rounded px-2 py-1 text-slate-700 dark:text-slate-300 font-medium"
                                                placeholder="Item name"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                min="1"
                                                onChange={(e) => splitState.updateReceiptItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                                                className="w-full bg-slate-100 dark:bg-slate-900 border-0 focus:ring-1 focus:ring-primary rounded px-2 py-1 text-center text-slate-700 dark:text-slate-300"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => splitState.updateReceiptItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent border-0 focus:ring-1 focus:ring-primary rounded px-2 py-1 text-right text-slate-700 dark:text-slate-300 font-mono"
                                            />
                                        </td>
                                        <td className="py-2 pl-2 text-right font-bold text-slate-800 dark:text-white font-mono">
                                            {formatRp(item.total)}
                                        </td>
                                        <td className="py-2 pl-2 text-right">
                                            <button
                                                onClick={() => splitState.removeReceiptItem(item.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100 p-1"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {splitState.receiptData.items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400">
                                            {t('splitBill.noItems') || 'No items found. Add items manually.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Section */}
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 max-w-sm">
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 transition-colors border border-slate-200 dark:border-white/5">
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${splitState.receiptData.taxInclusive ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${splitState.receiptData.taxInclusive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">{t('splitBill.taxInclusive') || 'Prices include Tax/Service'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('splitBill.taxInclusiveDesc') || 'Turn off if tax is added at the end.'}</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={splitState.receiptData.taxInclusive}
                                    onChange={(e) => splitState.updateReceiptTotals('taxInclusive', e.target.checked)}
                                />
                            </label>
                        </div>

                        <div className="flex-1 max-w-xs space-y-3 font-mono text-sm">
                            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                                <span>Subtotal:</span>
                                <span>{formatRp(splitState.receiptData.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-500 dark:text-slate-400">Tax/PPN:</span>
                                <input
                                    type="number"
                                    value={splitState.receiptData.tax}
                                    onChange={(e) => splitState.updateReceiptTotals('tax', parseFloat(e.target.value) || 0)}
                                    className="w-24 bg-slate-100 dark:bg-slate-900 border-0 focus:ring-1 focus:ring-primary rounded px-2 py-1 text-right text-slate-700 dark:text-slate-300 font-mono transition-colors"
                                />
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-500 dark:text-slate-400">Service:</span>
                                <input
                                    type="number"
                                    value={splitState.receiptData.serviceCharge}
                                    onChange={(e) => splitState.updateReceiptTotals('serviceCharge', parseFloat(e.target.value) || 0)}
                                    className="w-24 bg-slate-100 dark:bg-slate-900 border-0 focus:ring-1 focus:ring-primary rounded px-2 py-1 text-right text-slate-700 dark:text-slate-300 font-mono transition-colors"
                                />
                            </div>
                            <div className="flex justify-between items-center group border-b border-slate-200 dark:border-white/10 pb-3">
                                <span className="text-slate-500 dark:text-slate-400">Discount:</span>
                                <input
                                    type="number"
                                    value={splitState.receiptData.discount}
                                    onChange={(e) => splitState.updateReceiptTotals('discount', parseFloat(e.target.value) || 0)}
                                    className="w-24 bg-slate-100 dark:bg-slate-900 border-0 focus:ring-1 focus:ring-primary rounded px-2 py-1 text-right text-green-600 dark:text-green-400 font-mono transition-colors"
                                />
                            </div>
                            <div className="flex justify-between items-center text-lg font-black text-slate-800 dark:text-white pt-1">
                                <span>Grand Total:</span>
                                <span>{formatRp(splitState.receiptData.grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button onClick={splitState.reset} className="btn-secondary px-6">
                            {t('common.cancel') || 'Cancel'}
                        </button>
                        <button onClick={() => splitState.setCurrentStep('assign')} className="btn-primary px-8 flex items-center gap-2">
                            {t('common.next') || 'Next'}
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    // --- STEP 3: ASSIGN ---
    const renderStep3Assign = () => {
        const handleAddParticipant = (e: React.FormEvent) => {
            e.preventDefault();
            splitState.addParticipant(newParticipant);
            setNewParticipant('');
        };

        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col w-full bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-soft border border-slate-100 dark:border-white/5"
            >
                <div className="mb-6 border-b border-slate-100 dark:border-white/5 pb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('splitBill.assignTitle') || 'Who ate what?'}</h3>
                    <p className="text-sm text-slate-500 dark:text-text-muted mb-4">{t('splitBill.assignDesc') || 'Add people and tap their names on the items they ordered.'}</p>

                    {/* Participant Input */}
                    <form onSubmit={handleAddParticipant} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newParticipant}
                            onChange={(e) => setNewParticipant(e.target.value)}
                            placeholder={t('splitBill.addPerson') || 'Type a name...'}
                            className="flex-1 input-field max-w-xs"
                        />
                        <button type="submit" disabled={!newParticipant.trim()} className="btn-primary px-4 disabled:opacity-50">
                            {t('common.add') || 'Add'}
                        </button>
                    </form>

                    {/* Participant Chips */}
                    <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                            {splitState.participants.map(p => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="bg-lavender-100 dark:bg-slate-700 text-primary dark:text-lavender-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-lavender-200 dark:border-slate-600"
                                >
                                    {p.name}
                                    <button type="button" onClick={() => splitState.removeParticipant(p.id)} className="w-5 h-5 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors">
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {splitState.participants.length === 0 && (
                            <span className="text-sm text-slate-400 italic py-1">{t('splitBill.noPeople') || 'No people added yet.'}</span>
                        )}
                    </div>
                </div>

                {/* Assignment List */}
                <div className="w-full pr-0 md:pr-2 space-y-3 pb-8">
                    {splitState.receiptData.items.map(item => {
                        const assignedIds = splitState.itemAssignments[item.id] || [];
                        const isFullyAssigned = assignedIds.length > 0;
                        const individualCost = isFullyAssigned ? item.total / assignedIds.length : item.total;

                        return (
                            <div key={item.id} className={`p-4 rounded-2xl border transition-colors ${isFullyAssigned
                                ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10'
                                : 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-900/30 shadow-sm'
                                }`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white leading-tight">{item.name}</h4>
                                        <span className="text-xs text-slate-500 font-medium">Qty: {item.qty} × {formatRp(item.unitPrice)}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-800 dark:text-white font-mono">{formatRp(item.total)}</div>
                                        {isFullyAssigned && assignedIds.length > 1 && (
                                            <div className="text-xs font-bold text-primary font-mono">{formatRp(individualCost)} / person</div>
                                        )}
                                        {!isFullyAssigned && (
                                            <div className="text-xs font-bold text-red-500">Unassigned</div>
                                        )}
                                    </div>
                                </div>

                                {/* Toggle Chips */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {splitState.participants.map(p => {
                                        const isSelected = assignedIds.includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => splitState.toggleItemAssignment(item.id, p.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isSelected
                                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105'
                                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                                    }`}
                                            >
                                                {p.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <button onClick={() => splitState.setCurrentStep('review')} className="btn-secondary px-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">arrow_back</span>
                        {t('common.back') || 'Back'}
                    </button>
                    <button
                        onClick={() => splitState.setCurrentStep('result')}
                        disabled={splitState.participants.length === 0}
                        className="btn-primary px-8 flex items-center gap-2 disabled:opacity-50"
                    >
                        {t('splitBill.calculate') || 'Calculate'}
                        <span className="material-symbols-outlined">receipt_long</span>
                    </button>
                </div>
            </motion.div>
        );
    };

    // --- STEP 4: RESULT ---
    const renderStep4Result = () => {
        const results = splitState.calculateResults();

        const handleExportImage = async () => {
            if (resultRef.current) {
                try {
                    const dataUrl = await htmlToImage.toPng(resultRef.current, { backgroundColor: '#ffffff' });
                    const link = document.createElement('a');
                    link.download = 'split-bill-result.png';
                    link.href = dataUrl;
                    link.click();
                } catch (err) {
                    console.error('Error generating image', err);
                }
            }
        };

        const handleExportWa = () => {
            let text = `*🧾 SPLIT BILL SUMMARY*\n\n`;

            results.participants.forEach(p => {
                if (p.total > 0) {
                    text += `*👤 ${p.name}: ${formatRp(p.total)}*\n`;
                    p.items.forEach(item => {
                        text += `  - ${item.name}: ${formatRp(item.amount)}\n`;
                    });
                    if (p.taxShare > 0 || p.serviceShare > 0 || p.discountShare > 0) {
                        text += `  _(Incl. Tax/Svc/Disc: ${formatRp(p.taxShare + p.serviceShare - p.discountShare)})_\n`;
                    }
                    text += `\n`;
                }
            });

            if (results.unassignedTotal > 0) {
                text += `⚠️ *UNASSIGNED: ${formatRp(results.unassignedTotal)}*\n\n`;
            }

            text += `_Total Bill: ${formatRp(splitState.receiptData.grandTotal)}_\n`;
            text += `_Generated with Rupiku App_`;

            // url encode and open WA
            const encodedText = encodeURIComponent(text);
            window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        };

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col w-full items-center relative"
            >
                {/* Export Buttons Header */}
                <div className="w-full flex justify-between items-center mb-6 max-w-2xl">
                    <button onClick={() => splitState.setCurrentStep('assign')} className="btn-secondary py-2 px-3 flex items-center gap-1 text-sm bg-white dark:bg-slate-800 shadow-sm leading-none pl-2">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        <span>{t('common.edit') || 'Edit'}</span>
                    </button>

                    <div className="flex gap-2">
                        <button onClick={handleExportWa} className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border-0 font-bold">
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            WhatsApp
                        </button>
                        <button onClick={handleExportImage} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Save Image
                        </button>
                    </div>
                </div>

                {/* The "Receipt" Result View to be converted to Image */}
                <div
                    ref={resultRef}
                    className="w-full max-w-2xl bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-xl border border-slate-100 relative overflow-hidden"
                >
                    {/* Decorative receipt zig-zag top/bottom (optional CSS tricks, pure styling) */}

                    <div className="text-center mb-8 pb-6 border-b-2 border-dashed border-slate-200">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Split Bill</h2>
                        <p className="text-slate-500 font-medium mt-1">{new Date().toLocaleDateString()}</p>
                    </div>

                    {results.unassignedTotal > 0 && (
                        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex justify-between items-center font-bold">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined">warning</span>
                                Unassigned Items
                            </div>
                            <span>{formatRp(results.unassignedTotal)}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        {results.participants.filter(p => p.total > 0).map(p => (
                            <div key={p.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-black">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                        {p.name}
                                    </h3>
                                    <div className="text-xl font-black text-slate-800 font-mono">
                                        {formatRp(p.total)}
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4 text-sm">
                                    {p.items.map(item => (
                                        <div key={item.id} className="flex justify-between text-slate-600">
                                            <span>{item.name}</span>
                                            <span className="font-mono">{formatRp(item.amount)}</span>
                                        </div>
                                    ))}
                                    {(p.taxShare > 0 || p.serviceShare > 0 || p.discountShare > 0) && (
                                        <div className="flex justify-between text-slate-400 pt-2 mt-2 border-t border-slate-200 italic text-xs">
                                            <span>Pro-rata Tax/Svc/Disc</span>
                                            <span className="font-mono">
                                                {formatRp(p.taxShare + p.serviceShare - p.discountShare)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                        <span className="text-lg font-bold text-slate-500">Total Receipt</span>
                        <span className="text-2xl font-black text-slate-800 font-mono">{formatRp(splitState.receiptData.grandTotal)}</span>
                    </div>

                    {/* Rupiku Watermark */}
                    <div className="mt-12 flex flex-col items-center justify-center opacity-40">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 bg-slate-900 text-white rounded-[8px] flex items-center justify-center transform rotate-3 shadow-sm">
                                <img src="/logo.png" alt="Logo" className="w-3.5 h-3.5 object-contain" />
                            </span>
                            <span className="font-black tracking-tight text-slate-900 text-lg">Rupiku.</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Generated via Rupiku - Split Bill</span>
                    </div>
                </div>

                <div className="mt-8">
                    <button onClick={splitState.reset} className="text-slate-500 hover:text-primary font-bold transition-colors">
                        Start New Split Bill
                    </button>
                </div>
            </motion.div>
        );
    };

    // --- UPGRADE PROMPT ---
    const renderUpgradePrompt = () => (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-white dark:bg-[#2b2616] rounded-3xl border border-slate-200 dark:border-[#f4c025]/20 p-8 md:p-12 max-w-lg text-center shadow-xl">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30">
                    <Lock className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-3">
                    Split Bill
                </h1>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-amber-100 dark:bg-amber-500/20">
                    <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Platinum Exclusive</span>
                </div>

                {/* Description */}
                <p className="text-slate-500 dark:text-[#cbbc90] mb-8 leading-relaxed">
                    Unlock the AI-powered Split Bill feature to instantly scan receipts, assign items to friends, and calculate pro-rata tax and service charges.
                </p>

                {/* Features List */}
                <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                    {[
                        { icon: <Receipt size={18} />, text: 'AI Receipt Scanner' },
                        { icon: <Users size={18} />, text: 'Friend Assignment' },
                        { icon: <PlusCircle size={18} />, text: 'Pro-Rata Tax/Svc' },
                        { icon: <Calculator size={18} />, text: 'Smart Calculation' },
                    ].map((feature) => (
                        <div key={feature.text} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-[#1e1b10] rounded-xl">
                            <span className="text-amber-500">{feature.icon}</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-white">{feature.text}</span>
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                <button
                    onClick={() => navigate('/settings')}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <Crown className="w-5 h-5" />
                    Upgrade to Platinum
                </button>

                <p className="text-xs text-slate-400 dark:text-[#8e8568] mt-4">
                    Admin will review your upgrade request
                </p>
            </div>
        </div>
    );

    // --- MAIN RENDERER ---
    if (!isPremium) {
        return (
            <div className="p-4 md:p-6 w-full max-w-[1600px] mx-auto">
                {renderUpgradePrompt()}
            </div>
        );
    }

    return (
        <div className="flex flex-col pt-6 pb-8 md:py-8 px-2 md:px-8 max-w-7xl mx-auto w-full">
            {/* Header/Stepper */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-6">
                    {t('splitBill.title') || 'Split Bill'}
                </h1>

                {/* Minimalist Progress Bar */}
                <div className="flex items-center w-full max-w-xl">
                    {['capture', 'review', 'assign', 'result'].map((step, index) => {
                        const stepNames = ['Upload', 'Review', 'Assign', 'Result'];
                        const stepIndexes = { capture: 0, review: 1, assign: 2, result: 3 };
                        const isActive = stepIndexes[splitState.currentStep] >= index;
                        const isCurrent = splitState.currentStep === step;

                        return (
                            <React.Fragment key={step}>
                                <div className="flex flex-col items-center relative">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 z-10 ${isActive ? 'bg-primary text-white shadow-glow' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <span className={`absolute -bottom-6 text-xs font-bold whitespace-nowrap hidden sm:block ${isCurrent ? 'text-primary' : 'text-slate-400'
                                        }`}>
                                        {stepNames[index]}
                                    </span>
                                </div>
                                {index < 3 && (
                                    <div className={`flex-1 h-1 mx-2 rounded-full transition-colors duration-300 ${stepIndexes[splitState.currentStep] > index ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                                        }`}></div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="w-full sm:mt-8">
                <AnimatePresence mode='wait'>
                    {splitState.currentStep === 'capture' && <div key="capture" className="w-full">{renderStep1Capture()}</div>}
                    {splitState.currentStep === 'review' && <div key="review" className="w-full">{renderStep2Review()}</div>}
                    {splitState.currentStep === 'assign' && <div key="assign" className="w-full">{renderStep3Assign()}</div>}
                    {splitState.currentStep === 'result' && <div key="result" className="w-full">{renderStep4Result()}</div>}
                </AnimatePresence>
            </div>

            {/* Mobile Bottom Spacer to clear FAB and Navbar */}
            <div className="h-40 w-full shrink-0 md:hidden flex-none"></div>
        </div>
    );
};

export default SplitBill;
