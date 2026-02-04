
import React, { useState } from 'react';
import api from '../services/api';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const [walletFilter, setWalletFilter] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleExport = async () => {
        setLoading(true);
        try {
            // Determine URL with params
            const params = new URLSearchParams();
            if (walletFilter) params.append('wallet', walletFilter);

            // Axios blob response for file download
            const response = await api.get(`/export?${params.toString()}`, {
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'FinTrack_Report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();

            onClose();
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export report.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#2a2515] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-[#493f22]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Export Report</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-slate-500 dark:text-[#cbbc90] text-sm font-medium mb-2">Filter by Wallet (Optional)</label>
                        <select
                            value={walletFilter}
                            onChange={(e) => setWalletFilter(e.target.value)}
                            className="appearance-none w-full rounded-xl border border-slate-200 dark:border-[#685a31] bg-slate-50 dark:bg-[#342d18] text-slate-900 dark:text-white p-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">All Wallets</option>
                            <option value="Bank">Bank Only</option>
                            <option value="Cash">Cash Only</option>
                            <option value="E-wallet">E-wallet Only</option>
                        </select>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#1f1b10] p-4 rounded-xl text-xs text-slate-500 dark:text-[#cbbc90]">
                        <p className="font-bold mb-2">Report Includes:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Bocor Halus Analysis ({'<'} 20k)</li>
                            <li>Full Audit Trail</li>
                            <li>Savings Milestones</li>
                            <li>Budget Performance</li>
                        </ul>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-70 mt-2 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Generating...' : 'Download Excel'}
                        {!loading && <span className="material-symbols-outlined text-[18px]">download</span>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
