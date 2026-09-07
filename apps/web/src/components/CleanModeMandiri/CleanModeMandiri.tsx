import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Check, X, Eye, EyeOff, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { authService } from '../../services/authService';
import { dashboardService } from '../../services/dashboardService';
import MandiriStatementModal from './MandiriStatementModal';

interface TransactionItem {
    id: string;
    icon: string;
    title: string;
    description: string;
    amount: number;
    cents: string;
    type: 'expense' | 'income';
}

interface DateGroup {
    date: string;
    items: TransactionItem[];
}

const DEFAULT_TRANSACTIONS: DateGroup[] = [
    {
        date: '05 Sep 2026',
        items: [
            {
                id: 'm1',
                icon: '/clean-mode-mandiri/mandiri_mutasi_qr.png',
                title: 'QR Bayar',
                description: 'Pembayaran QR\nke IDM QRIS LIVIN\n624827123587',
                amount: 75300,
                cents: '00',
                type: 'expense',
            },
            {
                id: 'm2',
                icon: '/clean-mode-mandiri/mandiri_mutasi_transfer.png',
                title: 'Transfer Rupiah',
                description: 'Transfer BI Fast\nKe BANK BNI\nSUHENDRA WAHYU 1817362467',
                amount: 285000,
                cents: '00',
                type: 'expense',
            },
            {
                id: 'm3',
                icon: '/clean-mode-mandiri/mandiri_mutasi_biaya.png',
                title: 'Biaya',
                description: 'Biaya transfer BI Fast',
                amount: 2500,
                cents: '00',
                type: 'expense',
            },
        ],
    },
    {
        date: '04 Sep 2026',
        items: [
            {
                id: 'm4',
                icon: '/clean-mode-mandiri/mandiri_mutasi_biaya.png',
                title: 'Biaya',
                description: 'Biaya transfer BI Fast',
                amount: 2500,
                cents: '00',
                type: 'expense',
            },
            {
                id: 'm5',
                icon: '/clean-mode-mandiri/mandiri_mutasi_transfer.png',
                title: 'Transfer Rupiah',
                description: 'Transfer BI Fast\nKe BCA\nRANO 7245614730',
                amount: 1700000,
                cents: '00',
                type: 'expense',
            },
            {
                id: 'm6',
                icon: '/clean-mode-mandiri/mandiri_mutasi_transfer.png',
                title: 'Transfer Rupiah',
                description: 'Transfer BI Fast\nKe BANK MANDIRI\nTYAS ALIFA ARDAYANTI 1370018899231',
                amount: 450000,
                cents: '00',
                type: 'expense',
            },
        ],
    },
    {
        date: '02 Sep 2026',
        items: [
            {
                id: 'm7',
                icon: '/clean-mode-mandiri/mandiri_tx_qr.png',
                title: 'QR Bayar',
                description: 'Pembayaran QR ke KOPI KENANGAN SENOPATI',
                amount: 38000,
                cents: '00',
                type: 'expense',
            },
            {
                id: 'm8',
                icon: '/clean-mode-mandiri/mandiri_tx_transfer.png',
                title: 'Transfer Rupiah',
                description: 'Transfer BI Fast\nKe BANK BNI\nPAGUYUBAN PEGAWAI KP 1902837461',
                amount: 200000,
                cents: '00',
                type: 'expense',
            },
        ],
    },
    {
        date: '01 Sep 2026',
        items: [
            {
                id: 'm9',
                icon: '/clean-mode-mandiri/mandiri_tx_transfer.png',
                title: 'Transfer Rupiah',
                description: 'PAYROLL SALARY CREDIT PT MANDIRI CORP',
                amount: 35000000,
                cents: '00',
                type: 'income',
            },
        ],
    },
];

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
            <div className="w-full max-w-[430px] h-[100dvh] relative bg-gradient-to-b from-[#52a7e5] via-[#439fe3] to-[#3896df] overflow-hidden flex flex-col shadow-2xl">
                
                {/* Background Subtle Organic Wave Curves (Livin' Dynamic Light Waves) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <svg className="absolute w-full h-[520px] top-0 left-0" viewBox="0 0 430 520" fill="none" preserveAspectRatio="none">
                        <path d="M-30 200 C 90 190, 160 300, 270 280 C 350 260, 420 220, 470 240 L 470 0 L -30 0 Z" fill="url(#waveGrad1)" />
                        <path d="M-30 270 C 100 250, 200 370, 320 330 C 390 300, 430 270, 470 280 L 470 0 L -30 0 Z" fill="url(#waveGrad2)" />
                        <defs>
                            <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
                                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
                            </linearGradient>
                            <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>
                    </svg>
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
                    <div className="w-full grid grid-cols-4 gap-2 mt-[24px]">
                        {/* Action 1: Transfer Rupiah */}
                        <div className="flex flex-col items-center">
                            <button className="w-[64px] h-[64px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-transform hover:shadow-md">
                                <img
                                    src="/clean-mode-mandiri/mandiri_action_transfer.png"
                                    alt="Transfer Rupiah"
                                    className="w-[33px] h-[33px] object-contain"
                                />
                            </button>
                            <div className="mt-2 h-[30px] flex flex-col items-center justify-start">
                                <span className="text-white text-[12.5px] font-normal leading-[14px] text-center whitespace-pre-line">
                                    {'Transfer\nRupiah'}
                                </span>
                            </div>
                        </div>

                        {/* Action 2: Bayar/VA */}
                        <div className="flex flex-col items-center">
                            <button className="w-[64px] h-[64px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-transform hover:shadow-md">
                                <img
                                    src="/clean-mode-mandiri/mandiri_action_bayar.png"
                                    alt="Bayar/VA"
                                    className="w-[33px] h-[33px] object-contain"
                                />
                            </button>
                            <div className="mt-2 h-[30px] flex flex-col items-center justify-start">
                                <span className="text-white text-[12.5px] font-normal leading-[14px] text-center">
                                    Bayar/VA
                                </span>
                            </div>
                        </div>

                        {/* Action 3: Top-up */}
                        <div className="flex flex-col items-center">
                            <button className="w-[64px] h-[64px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-transform hover:shadow-md">
                                <img
                                    src="/clean-mode-mandiri/mandiri_action_topup.png"
                                    alt="Top-up"
                                    className="w-[33px] h-[33px] object-contain"
                                />
                            </button>
                            <div className="mt-2 h-[30px] flex flex-col items-center justify-start">
                                <span className="text-white text-[12.5px] font-normal leading-[14px] text-center">
                                    Top-up
                                </span>
                            </div>
                        </div>

                        {/* Action 4: Kartu Fisik/Virtual */}
                        <div className="flex flex-col items-center">
                            <button className="w-[64px] h-[64px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-transform hover:shadow-md">
                                <img
                                    src="/clean-mode-mandiri/mandiri_action_card.png"
                                    alt="Kartu Fisik/Virtual"
                                    className="w-[33px] h-[33px] object-contain"
                                />
                            </button>
                            <div className="mt-2 h-[30px] flex flex-col items-center justify-start">
                                <span className="text-white text-[12.5px] font-normal leading-[14px] text-center whitespace-pre-line">
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
                        className="w-full pt-[13px] pb-[10px] cursor-pointer flex justify-center items-center shrink-0"
                    >
                        <div className="w-[44px] h-[4.5px] rounded-full bg-[#5f5959]" />
                    </div>

                    {/* Sheet Header: Transaksi & e-Statement */}
                    <div className="px-5 pt-0.5 pb-3 flex items-center justify-between shrink-0">
                        <h2 className="text-[17px] font-semibold text-[#1e1e1e] tracking-[-0.01em]">
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
                    <div className="h-[46px] border-b border-[#ededed] flex items-center justify-between shrink-0 pl-5 pr-4">
                        {/* Horizontal Months (Right-aligned so active month 'September' sits next to utilities) */}
                        <div
                            ref={monthScrollRef}
                            className="h-full flex items-center space-x-7 overflow-x-auto no-scrollbar"
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
                                        className={`relative h-full flex items-center px-1 text-[15px] whitespace-nowrap transition-colors ${
                                            isActive
                                                ? 'font-semibold text-[#111111]'
                                                : 'font-normal text-[#757575] hover:text-[#333333]'
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
                            <div className="h-[24px] w-[1px] bg-[#ededed] mx-2 shrink-0" />

                            {/* CS Assistant Avatar */}
                            <button
                                onClick={() => setToastMessage('Fitur Livin Assistant siap digunakan')}
                                className="w-9 h-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-all"
                                title="Livin Assistant"
                            >
                                <img
                                    src="/clean-mode-mandiri/mandiri_avatar_cs.png"
                                    alt="Livin Assistant"
                                    className="w-[25px] h-[25px] object-contain"
                                />
                            </button>

                            {/* Divider 2 */}
                            <div className="h-[24px] w-[1px] bg-[#ededed] mx-2 shrink-0" />

                            {/* Search Button */}
                            <button
                                onClick={() => setToastMessage('Pencarian mutasi')}
                                className="w-8 h-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-all"
                                title="Cari Transaksi"
                            >
                                <img
                                    src="/clean-mode-mandiri/mandiri_icon_search.png"
                                    alt="Search"
                                    className="w-[18px] h-[18px] object-contain"
                                />
                            </button>
                        </div>
                    </div>

                    {/* Transactions Feed List (Calibrated row height so exactly 2 transactions fit in the initial fold) */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-16">
                        {DEFAULT_TRANSACTIONS.map(group => (
                            <div key={group.date}>
                                {/* Date Section Header */}
                                <div className="text-[13px] font-medium text-[#7c7c80] pt-[16px] pb-[8px] px-5 tracking-tight">
                                    {group.date}
                                </div>

                                {/* Items under this date */}
                                <div className="divide-y divide-[#f4f4f4]">
                                    {group.items.map(item => (
                                        <div key={item.id} className="flex items-start justify-between gap-3 px-5 py-[19px]">
                                            {/* Icon + Details */}
                                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                                <img
                                                    src={item.icon}
                                                    alt={item.title}
                                                    className="w-[30px] h-[30px] object-contain shrink-0 mt-0.5"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[15.5px] font-bold text-[#111111] leading-snug">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-[12px] font-normal text-[#5c5c60] leading-[17px] mt-1 whitespace-pre-line break-words">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Nominal with Superscript Cents */}
                                            <div
                                                className={`text-[16.5px] font-bold shrink-0 text-right whitespace-nowrap tracking-tight ${
                                                    item.type === 'income' ? 'text-[#16a34a]' : 'text-[#111111]'
                                                }`}
                                            >
                                                <span>
                                                    {item.type === 'income' ? '+ IDR ' : '- IDR '}
                                                    {item.amount.toLocaleString('id-ID')}
                                                </span>
                                                <sup className="text-[10px] font-bold align-top relative -top-1.5 ml-[1px]">
                                                    {item.cents}
                                                </sup>
                                            </div>
                                        </div>
                                    ))}
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

                {/* Statement Modal */}
                <MandiriStatementModal
                    isOpen={isStatementOpen}
                    onClose={() => setIsStatementOpen(false)}
                    accountNumber={accountNumber}
                    accountName={accountName}
                    currentBalance={balance}
                    selectedMonth={`${selectedMonth} 2026`}
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
