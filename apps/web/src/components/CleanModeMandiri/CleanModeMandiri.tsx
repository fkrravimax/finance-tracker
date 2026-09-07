import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Check, X, Eye, EyeOff, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { authService } from '../../services/authService';
import { dashboardService } from '../../services/dashboardService';
import MandiriStatementModal, { type MandiriMutationItem, DEFAULT_MANDIRI_MUTATIONS } from './MandiriStatementModal';

export const CleanModeMandiri: React.FC = () => {
    const navigate = useNavigate();

    // 1. Admin Role Access Protection
    useEffect(() => {
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    // 2. Persistent State from LocalStorage
    const [accountName, setAccountName] = useState<string>(() => {
        return localStorage.getItem('mandiri_clean_mode_account_name') || 'Tabungan Payroll';
    });

    const [accountNumber, setAccountNumber] = useState<string>(() => {
        return localStorage.getItem('mandiri_clean_mode_account_number') || '1640003265669';
    });

    const [balance, setBalance] = useState<number>(() => {
        const saved = localStorage.getItem('mandiri_clean_mode_balance');
        if (saved !== null && !isNaN(Number(saved))) {
            return Number(saved);
        }
        return 34789850.18;
    });

    const [isMasked, setIsMasked] = useState<boolean>(() => {
        return localStorage.getItem('mandiri_clean_mode_balance_masked') === 'true';
    });

    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        return localStorage.getItem('mandiri_clean_mode_selected_month') || 'September';
    });

    // Feedback states
    const [copied, setCopied] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Modals
    const [isStatementOpen, setIsStatementOpen] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

    // Settings inputs
    const [inputName, setInputName] = useState<string>('');
    const [inputAccount, setInputAccount] = useState<string>('');
    const [inputBalance, setInputBalance] = useState<string>('');
    const [inputMonth, setInputMonth] = useState<string>('');
    const [fetchingReal, setFetchingReal] = useState<boolean>(false);

    // Sheet expansion state: 'collapsed' (mid screen ~50%) or 'expanded' (top ~80px)
    const [isSheetExpanded, setIsSheetExpanded] = useState<boolean>(false);

    // Month scroll ref to align September on the right (showing 2.5-3 months like real Livin')
    const monthScrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (monthScrollRef.current) {
            monthScrollRef.current.scrollLeft = monthScrollRef.current.scrollWidth;
        }
    }, []);

    // Format helper for Mandiri balance: Integer part separated by dots, cents as string
    const formatBalanceParts = (val: number) => {
        const fixed = val.toFixed(2);
        const [intPart, centPart] = fixed.split('.');
        const formattedInt = Number(intPart).toLocaleString('id-ID');
        return {
            formattedInt,
            cents: centPart || '00',
        };
    };

    const { formattedInt, cents } = formatBalanceParts(balance);

    // Custom mutations state (stored in localStorage)
    const [mutations, setMutations] = useState<MandiriMutationItem[]>(() => {
        try {
            const saved = localStorage.getItem('mandiri_clean_mode_custom_mutations');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to load custom mutations:', e);
        }
        return DEFAULT_MANDIRI_MUTATIONS;
    });

    const handleSaveMutations = (newMutations: MandiriMutationItem[]) => {
        setMutations(newMutations);
        try {
            localStorage.setItem('mandiri_clean_mode_custom_mutations', JSON.stringify(newMutations));
        } catch (e) {
            console.error('Failed to save custom mutations:', e);
        }
        setToastMessage('Mutasi berhasil diperbarui');
    };

    // Dynamically map month abbreviation based on active selectedMonth
    const getMonthAbbr = (m: string) => {
        const lower = m.toLowerCase();
        if (lower.startsWith('sep')) return 'Sep';
        if (lower.startsWith('agu')) return 'Agu';
        if (lower.startsWith('jul')) return 'Jul';
        if (lower.startsWith('jun')) return 'Jun';
        if (lower.startsWith('mei')) return 'Mei';
        return m.slice(0, 3);
    };

    const currentMonthAbbr = getMonthAbbr(selectedMonth);

    // Group items dynamically by day + currentMonthAbbr + 2026
    const groupedMutations = useMemo(() => {
        const groups: { date: string; items: MandiriMutationItem[] }[] = [];
        mutations.forEach(item => {
            const dayStr = (item.day || '05').padStart(2, '0');
            const dateHeader = `${dayStr} ${currentMonthAbbr} 2026`;
            let grp = groups.find(g => g.date === dateHeader);
            if (!grp) {
                grp = { date: dateHeader, items: [] };
                groups.push(grp);
            }
            grp.items.push(item);
        });
        return groups;
    }, [mutations, currentMonthAbbr]);

    const handleCopyAccountNumber = () => {
        navigator.clipboard.writeText(accountNumber.replace(/\D/g, ''));
        setCopied(true);
        setToastMessage('Nomor rekening berhasil disalin!');
        setTimeout(() => {
            setCopied(false);
            setToastMessage(null);
        }, 2000);
    };

    // Open Settings Modal
    const handleOpenSettings = () => {
        setInputName(accountName);
        setInputAccount(accountNumber);
        setInputBalance(balance.toString());
        setInputMonth(selectedMonth);
        setIsSettingsOpen(true);
    };

    // Save Settings permanently
    const handleSaveSettings = () => {
        const trimmedName = inputName.trim() || 'Tabungan Payroll';
        const trimmedAcc = inputAccount.trim() || '1640003265669';
        const parsedBal = parseFloat(inputBalance.replace(/[^0-9.]/g, '')) || 34789850.18;
        const trimmedMonth = inputMonth.trim() || 'September';

        setAccountName(trimmedName);
        setAccountNumber(trimmedAcc);
        setBalance(parsedBal);
        setSelectedMonth(trimmedMonth);

        localStorage.setItem('mandiri_clean_mode_account_name', trimmedName);
        localStorage.setItem('mandiri_clean_mode_account_number', trimmedAcc);
        localStorage.setItem('mandiri_clean_mode_balance', parsedBal.toString());
        localStorage.setItem('mandiri_clean_mode_selected_month', trimmedMonth);

        setIsSettingsOpen(false);
        setToastMessage('Pengaturan Mandiri berhasil disimpan!');
        setTimeout(() => setToastMessage(null), 2500);
    };

    // Preset: Exact Mandiri Reference values
    const handleResetToMandiriReference = () => {
        setInputName('Tabungan Payroll');
        setInputAccount('1640003265669');
        setInputBalance('34789850.18');
        setInputMonth('September');
    };

    // Preset: Fetch Real Rupiku Balance
    const handleFetchRealData = async () => {
        setFetchingReal(true);
        try {
            const stats = await dashboardService.getStats();
            if (stats && typeof stats.totalBalance === 'number') {
                setInputBalance(stats.totalBalance.toFixed(2));
            }
        } catch (err) {
            console.error('Failed to fetch real data:', err);
        } finally {
            setFetchingReal(false);
        }
    };

    const months = ['Mei', 'Juni', 'Juli', 'Agustus', 'September'];

    return (
        <div 
            className="clean-mode-mandiri min-h-screen w-full bg-[#1b4b72] flex justify-center items-start select-none overflow-hidden"
            style={{ fontFamily: "'LivinFont', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif" }}
        >
            {/* Main Phone Viewport Container (Dynamic 100dvh to match phone screen exactly) */}
            <div className="w-full max-w-[430px] h-[100dvh] relative bg-[#439fe3] overflow-hidden flex flex-col shadow-2xl">
                
                {/* Background Image: Authentic Native Livin' Mandiri Fluid Wave Motif */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <img
                        src="/clean-mode-mandiri/bg-mandiri.png"
                        alt="Mandiri Background Motif"
                        className="w-full h-[52%] object-cover object-top select-none pointer-events-none"
                    />
                </div>

                {/* Hero Section Container (Occupies exactly top 50% of the screen) */}
                <div className="relative z-10 w-full h-[50%] flex flex-col items-center pt-[max(calc(env(safe-area-inset-top)+32px),82px)] px-5">
                    
                    {/* Top Bar: Back Arrow, Centered Card, Settings Gear (Arrow & Settings aligned with top of card) */}
                    <div className="relative w-full flex justify-center items-start min-h-[52px]">
                        {/* Back Arrow */}
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="absolute left-1 top-1 w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 rounded-full transition-all"
                            aria-label="Kembali"
                        >
                            <ArrowLeft className="w-[22px] h-[22px] stroke-[2.4]" />
                        </button>

                        {/* Centered Miniature Mandiri Debit Platinum Batik Card */}
                        <div className="flex flex-col items-center">
                            <img
                                src="/clean-mode-mandiri/mandiri_card_batik.png"
                                alt="Kartu Mandiri Debit Platinum"
                                className="w-[82px] h-[52px] object-cover rounded-[5px]"
                            />
                        </div>

                        {/* Settings Button */}
                        <button
                            onClick={handleOpenSettings}
                            className="absolute right-1 top-1 w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 rounded-full transition-all"
                            aria-label="Pengaturan Clean Mode Mandiri"
                        >
                            <Settings className="w-[22px] h-[22px] stroke-[2.2]" />
                        </button>
                    </div>

                    {/* Account Name & Number with tight natural spacing */}
                    <div className="flex flex-col items-center text-center mt-[10px]">
                        <h1 
                            className="text-white text-[19.5px] font-semibold tracking-[0.01em]"
                            style={{ fontFamily: "'LivinFont', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}
                        >
                            {accountName}
                        </h1>

                        <button
                            onClick={handleCopyAccountNumber}
                            className="mt-[3px] flex items-center justify-center text-white text-[15.5px] font-normal tracking-[0.04em] hover:text-white/90 transition-opacity active:opacity-75"
                            style={{ fontFamily: "'LivinFont', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif" }}
                            title="Salin nomor rekening"
                        >
                            <span style={{ fontFamily: "'LivinFont', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif" }}>{accountNumber}</span>
                            {copied ? (
                                <Check className="w-[19px] h-[19px] text-emerald-300 ml-2.5 inline-block" />
                            ) : (
                                <img
                                    src="/clean-mode-mandiri/mandiri_icon_copy.png"
                                    alt="Salin nomor rekening"
                                    className="w-[19px] h-[21px] object-contain ml-2.5 inline-block"
                                />
                            )}
                        </button>

                        {/* Main Balance with Superscript Cents */}
                        <div className="mt-[11px] flex items-center justify-center">
                            {isMasked ? (
                                <span 
                                    className="text-white text-[23.5px] font-bold tracking-widest"
                                    style={{ fontFamily: "'LivinFont', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}
                                >
                                    Rp ••••••••••
                                </span>
                            ) : (
                                <div 
                                    className="text-white text-[23.5px] font-bold tracking-tight flex items-baseline"
                                    style={{ fontFamily: "'LivinFont', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}
                                >
                                    <span>Rp {formattedInt}</span>
                                    <sup className="text-[13.5px] font-bold align-top relative -top-1 ml-0.5 tracking-normal">
                                        {cents}
                                    </sup>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    const next = !isMasked;
                                    setIsMasked(next);
                                    localStorage.setItem('mandiri_clean_mode_balance_masked', String(next));
                                }}
                                className="ml-2 text-white/80 hover:text-white transition-colors"
                            >
                                {isMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-0 hover:opacity-100" />}
                            </button>
                        </div>
                    </div>

                    {/* 4 Quick Action Buttons */}
                    <div className="w-full grid grid-cols-4 gap-2 mt-[34px]">
                        {/* Action 1: Transfer Rupiah */}
                        <div className="flex flex-col items-center">
                            <button className="w-[66px] h-[66px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-transform hover:shadow-md">
                                <img
                                    src="/clean-mode-mandiri/mandiri_action_transfer.png"
                                    alt="Transfer Rupiah"
                                    className="w-[34px] h-[34px] object-contain"
                                />
                            </button>
                            <div className="mt-2.5 h-[34px] flex flex-col items-center justify-start">
                                <span 
                                    className="text-white text-[13.5px] font-normal leading-[16.5px] text-center whitespace-pre-line"
                                    style={{ fontFamily: "'LivinFont', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif" }}
                                >
                                    {'Transfer\nRupiah'}
                                </span>
                            </div>
                        </div>

                        {/* Action 2: Bayar/VA */}
                        <div className="flex flex-col items-center">
                            <button className="w-[66px] h-[66px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-transform hover:shadow-md">
                                <img
                                    src="/clean-mode-mandiri/mandiri_action_bayar.png"
                                    alt="Bayar/VA"
                                    className="w-[34px] h-[34px] object-contain"
                                />
                            </button>
                            <div className="mt-2.5 h-[34px] flex flex-col items-center justify-start">
                                <span 
                                    className="text-white text-[13.5px] font-normal leading-[16.5px] text-center"
                                    style={{ fontFamily: "'LivinFont', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif" }}
                                >
                                    Bayar/VA
                                </span>
                            </div>
                        </div>

                        {/* Action 3: Top-up */}
                        <div className="flex flex-col items-center">
                            <button className="w-[66px] h-[66px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-transform hover:shadow-md">
                                <img
                                    src="/clean-mode-mandiri/mandiri_action_topup.png"
                                    alt="Top-up"
                                    className="w-[34px] h-[34px] object-contain"
                                />
                            </button>
                            <div className="mt-2.5 h-[34px] flex flex-col items-center justify-start">
                                <span 
                                    className="text-white text-[13.5px] font-normal leading-[16.5px] text-center"
                                    style={{ fontFamily: "'LivinFont', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif" }}
                                >
                                    Top-up
                                </span>
                            </div>
                        </div>

                        {/* Action 4: Kartu Fisik/Virtual */}
                        <div className="flex flex-col items-center">
                            <button className="w-[66px] h-[66px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-transform hover:shadow-md">
                                <img
                                    src="/clean-mode-mandiri/mandiri_action_card.png"
                                    alt="Kartu Fisik/Virtual"
                                    className="w-[34px] h-[34px] object-contain"
                                />
                            </button>
                            <div className="mt-2.5 h-[34px] flex flex-col items-center justify-start">
                                <span 
                                    className="text-white text-[13.5px] font-normal leading-[16.5px] text-center whitespace-pre-line"
                                    style={{ fontFamily: "'LivinFont', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif" }}
                                >
                                    {'Kartu Fisik/\nVirtual'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Sheet "Transaksi" (Occupies bottom 50% initially, expandable upward) */}
                <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: isSheetExpanded ? -240 : 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="relative z-20 h-[50%] bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden"
                >
                    {/* Drag Handle Bar (Calibrated 44px x 4.5px dark pill) */}
                    <div
                        onClick={() => setIsSheetExpanded(!isSheetExpanded)}
                        className="w-full pt-[18px] pb-[13px] cursor-pointer flex justify-center items-center shrink-0"
                    >
                        <div className="w-[44px] h-[4.5px] rounded-full bg-[#5f5959]" />
                    </div>

                    {/* Sheet Header: Transaksi & e-Statement */}
                    <div className="px-5 pt-1.5 pb-4 flex items-center justify-between shrink-0">
                        <h2 className="text-[17.5px] font-semibold text-[#1e1e1e] tracking-tight">
                            Transaksi
                        </h2>
                        <button
                            onClick={() => setIsStatementOpen(true)}
                            className="text-[14px] font-normal text-[#007dfe] hover:opacity-80 transition-opacity"
                        >
                            e-Statement
                        </button>
                    </div>

                    {/* Month Carousel & Utility Tools Bar */}
                    <div className="h-[50px] border-b border-[#ededed] flex items-center justify-between shrink-0 pl-0 pr-2.5">
                        {/* Horizontal Months (Right-aligned with calibrated gap-56px so Juli loses its 'J' and shows 'uli') */}
                        <div
                            ref={monthScrollRef}
                            className="flex-1 h-full flex items-center space-x-[56px] overflow-x-auto no-scrollbar pl-0"
                        >
                            {months.map(m => {
                                const isActive = selectedMonth.toLowerCase() === m.toLowerCase();
                                return (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            setSelectedMonth(m);
                                            localStorage.setItem('mandiri_clean_mode_selected_month', m);
                                        }}
                                        className={`relative h-full flex items-center px-1 text-[15px] whitespace-nowrap transition-colors shrink-0 ${
                                            isActive
                                                ? 'font-medium text-[#111111]'
                                                : 'font-normal text-[#666666] hover:text-[#333333]'
                                        }`}
                                    >
                                        <span>{m}</span>
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-[#007dfe] rounded-t-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Utilities: Vertical Divider + CS Avatar + Vertical Divider + Search */}
                        <div className="h-full flex items-center shrink-0">
                            {/* Divider 1 */}
                            <div className="h-[28px] w-[1px] bg-[#ededed] shrink-0 mr-1" />

                            {/* CS Assistant Avatar */}
                            <button
                                onClick={() => setToastMessage('Fitur Livin Assistant siap digunakan')}
                                className="w-[58px] h-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-all shrink-0"
                                title="Livin Assistant"
                            >
                                <img
                                    src="/clean-mode-mandiri/mandiri_avatar_cs.png"
                                    alt="Livin Assistant"
                                    className="w-[26px] h-[26px] object-contain"
                                />
                            </button>

                            {/* Divider 2 */}
                            <div className="h-[28px] w-[1px] bg-[#ededed] shrink-0" />

                            {/* Search Button */}
                            <button
                                onClick={() => setToastMessage('Pencarian mutasi')}
                                className="w-[52px] h-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-all shrink-0 pr-1"
                                title="Cari Transaksi"
                            >
                                <img
                                    src="/clean-mode-mandiri/mandiri_icon_search.png"
                                    alt="Cari Transaksi"
                                    className="w-[18px] h-[18px] object-contain"
                                />
                            </button>
                        </div>
                    </div>

                    {/* Transactions Feed List (Calibrated row height so exactly 2 transactions fit above the initial fold) */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-16">
                        {groupedMutations.map(group => (
                            <div key={group.date}>
                                {/* Date Section Header (Synchronized automatically with selectedMonth) */}
                                <div className="text-[13px] font-medium text-[#7c7c80] pt-[32px] pb-[12px] px-5 tracking-tight">
                                    {group.date}
                                </div>

                                {/* Items under this date */}
                                <div className="divide-y divide-[#eeeeee]">
                                    {group.items.map(item => {
                                        const iconSrc =
                                            item.typeId === 'qr'
                                                ? '/clean-mode-mandiri/mandiri_mutasi_qr.png'
                                                : '/clean-mode-mandiri/mandiri_mutasi_transfer.png';

                                        return (
                                            <div key={item.id} className="flex items-start justify-between gap-3 px-5 py-[26px]">
                                                {/* Icon + Details */}
                                                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                                    <img
                                                        src={iconSrc}
                                                        alt={item.title}
                                                        className="w-[32px] h-[32px] object-contain shrink-0 mt-0.5"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-[16px] font-semibold text-[#1c1c1e] leading-snug tracking-[-0.01em]">
                                                            {item.title}
                                                        </h3>
                                                        <p className="text-[12px] font-normal text-[#6c6c70] leading-[18px] mt-1.5 whitespace-pre-line break-words">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Nominal with Superscript Cents */}
                                                <div
                                                    className={`text-[16px] font-bold shrink-0 text-right whitespace-nowrap tracking-tight ${
                                                        item.type === 'income' ? 'text-[#16a34a]' : 'text-[#1c1c1e]'
                                                    }`}
                                                >
                                                    <span>
                                                        {item.type === 'income' ? '+ IDR ' : '- IDR '}
                                                        {item.amount.toLocaleString('id-ID')}
                                                    </span>
                                                    <sup className="text-[10px] font-bold align-top relative -top-1.5 ml-0.5">
                                                        {item.cents || '00'}
                                                    </sup>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Toast Notification */}
                <AnimatePresence>
                    {toastMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b]/95 backdrop-blur-md text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 border border-white/10"
                        >
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>{toastMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Statement / Mutation Customizer Modal */}
                <MandiriStatementModal
                    isOpen={isStatementOpen}
                    onClose={() => setIsStatementOpen(false)}
                    mutations={mutations}
                    onSave={handleSaveMutations}
                    selectedMonth={selectedMonth}
                />

                {/* Settings Modal */}
                <AnimatePresence>
                    {isSettingsOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-[#003d79] via-[#005ea6] to-[#0077d8] px-6 py-4 text-white flex justify-between items-center">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Settings className="w-4 h-4 text-yellow-300" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold">Pengaturan Clean Mode</h2>
                                            <p className="text-[11px] text-blue-100">Mandiri Mobile (Livin')</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsSettingsOpen(false)}
                                        className="p-1.5 rounded-full hover:bg-white/15 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Form Fields */}
                                <div className="p-6 space-y-4 overflow-y-auto">
                                    {/* Preset Buttons */}
                                    <div className="grid grid-cols-2 gap-2 pb-2">
                                        <button
                                            type="button"
                                            onClick={handleResetToMandiriReference}
                                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#005ea6] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-200/60 transition-colors"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                                            Acuan Mandiri
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleFetchRealData}
                                            disabled={fetchingReal}
                                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200/60 transition-colors disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${fetchingReal ? 'animate-spin' : ''}`} />
                                            Isi Data Rupiku
                                        </button>
                                    </div>

                                    {/* Account Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Nama Rekening / Tabungan
                                        </label>
                                        <input
                                            type="text"
                                            value={inputName}
                                            onChange={e => setInputName(e.target.value)}
                                            placeholder="Tabungan Payroll"
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0077d8] focus:bg-white transition-all"
                                        />
                                    </div>

                                    {/* Account Number */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Nomor Rekening
                                        </label>
                                        <input
                                            type="text"
                                            value={inputAccount}
                                            onChange={e => setInputAccount(e.target.value)}
                                            placeholder="1640003265669"
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0077d8] focus:bg-white transition-all font-mono"
                                        />
                                    </div>

                                    {/* Balance */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Saldo Utama (Rp)
                                        </label>
                                        <input
                                            type="text"
                                            value={inputBalance}
                                            onChange={e => setInputBalance(e.target.value)}
                                            placeholder="34789850.18"
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0077d8] focus:bg-white transition-all font-mono"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Mendukung desimal sen, contoh: 34789850.18
                                        </p>
                                    </div>

                                    {/* Month Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Bulan Aktif Transaksi
                                        </label>
                                        <select
                                            value={inputMonth}
                                            onChange={e => setInputMonth(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0077d8] focus:bg-white transition-all"
                                        >
                                            {months.map(m => (
                                                <option key={m} value={m}>
                                                    {m}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Persistence info banner */}
                                    <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                                        <Layers className="w-4 h-4 text-[#005ea6] shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-blue-900 leading-relaxed">
                                            Perubahan akan <strong>tersimpan permanen</strong> di perangkat Anda (LocalStorage) dan tidak akan terhapus meski aplikasi ditutup atau direfresh.
                                        </p>
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsSettingsOpen(false)}
                                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveSettings}
                                        className="px-5 py-2 bg-gradient-to-r from-[#005ea6] to-[#0077d8] hover:from-[#004e8a] hover:to-[#0066ba] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CleanModeMandiri;
