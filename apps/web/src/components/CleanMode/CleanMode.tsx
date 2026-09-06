import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, SlidersHorizontal, ArrowLeft, X } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { authService } from '../../services/authService';
import BcaStatementModal from './BcaStatementModal';

export const CleanMode: React.FC = () => {
    const navigate = useNavigate();

    // Core States
    const [balance, setBalance] = useState<number>(529265.71);
    const [isMasked, setIsMasked] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>('AHMAD FIKRI RAFI UDDIN');
    const [accountNumber, setAccountNumber] = useState<string>('801 - 040 - 1811');
    const [copied, setCopied] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Modals
    const [isStatementOpen, setIsStatementOpen] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [customNameInput, setCustomNameInput] = useState<string>('');
    const [customAccountInput, setCustomAccountInput] = useState<string>('');
    const [customBalanceInput, setCustomBalanceInput] = useState<string>('');

    // Carousel state
    const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'foryou' | 'account'>('home');

    // Main Menu Carousel State & Handlers
    const menuScrollRef = useRef<HTMLDivElement>(null);
    const [menuPage, setMenuPage] = useState<number>(0);

    const handleScrollLeft = () => {
        if (menuScrollRef.current) {
            menuScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            setMenuPage(0);
        }
    };

    const handleScrollRight = () => {
        if (menuScrollRef.current) {
            const maxScroll = menuScrollRef.current.scrollWidth - menuScrollRef.current.clientWidth;
            menuScrollRef.current.scrollTo({ left: maxScroll > 0 ? maxScroll : 95, behavior: 'smooth' });
            setMenuPage(1);
        }
    };

    const handleMenuScroll = () => {
        if (menuScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = menuScrollRef.current;
            const maxScroll = scrollWidth - clientWidth;
            if (maxScroll > 0) {
                setMenuPage(scrollLeft > maxScroll / 2 ? 1 : 0);
            }
        }
    };

    useEffect(() => {
        // Fetch current user from Rupiku
        const user = authService.getCurrentUser();
        if (user?.name) {
            setUserName(user.name.toUpperCase());
        }

        // Fetch real balance from Rupiku
        const fetchBalance = async () => {
            try {
                const stats = await dashboardService.getStats();
                if (stats && typeof stats.totalBalance === 'number' && stats.totalBalance > 0) {
                    setBalance(stats.totalBalance);
                }
            } catch (err) {
                console.warn('Using default Clean Mode balance:', err);
            }
        };
        fetchBalance();

        // Sync mobile browser status bar / notch color to match BCA Navy
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        const prevTheme = metaTheme?.getAttribute('content') || '#09090b';
        if (metaTheme) metaTheme.setAttribute('content', '#254c7f');

        return () => {
            if (metaTheme) metaTheme.setAttribute('content', prevTheme);
        };
    }, []);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(accountNumber.replace(/\s|-/g, ''));
        setCopied(true);
        showToast('Nomor rekening berhasil disalin!');
        setTimeout(() => setCopied(false), 2000);
    };

    const formatBalance = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    const handleOpenSettings = () => {
        setCustomNameInput(userName);
        setCustomAccountInput(accountNumber);
        setCustomBalanceInput(String(balance));
        setIsSettingsOpen(true);
    };

    const handleSaveCustomSettings = () => {
        if (customNameInput.trim()) setUserName(customNameInput.trim().toUpperCase());
        if (customAccountInput.trim()) setAccountNumber(customAccountInput.trim());
        if (customBalanceInput.trim() && !isNaN(Number(customBalanceInput))) {
            setBalance(Number(customBalanceInput));
        }
        setIsSettingsOpen(false);
        showToast('Pengaturan tampilan berhasil diperbarui!');
    };

    return (
        <div className="w-full min-h-screen bg-[#06182c] sm:py-3 flex items-center justify-center font-sans antialiased select-none">
            {/* Scoped CSS to permanently suppress brown scrollbars across all browsers */}
            <style>{`
                .cleanmode-menu-scroll::-webkit-scrollbar,
                .cleanmode-no-scrollbar::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                    background: transparent !important;
                }
                .cleanmode-menu-scroll,
                .cleanmode-no-scrollbar {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }
            `}</style>

            {/* Phone Viewport Container: 100% on Mobile, Realistic Clean Frame on Desktop */}
            <div
                className="w-full sm:w-[414px] h-screen sm:h-[896px] bg-[#f3f7fb] sm:rounded-[38px] sm:shadow-[0_20px_60px_rgba(0,0,0,0.6)] sm:border-[6px] sm:border-slate-800 flex flex-col relative overflow-hidden text-slate-900"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", "Open Sans", sans-serif' }}
            >

                {/* ── SCROLLABLE APP BODY (Containing Navy Header + Cards + Banners + Menu) ── */}
                <div
                    className="flex-1 overflow-y-auto cleanmode-no-scrollbar no-scrollbar pb-24"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >

                    {/* ── 1. DEEP NAVY BLUE HEADER & CARD SECTION (Exact matching CONTOHTAMPILAN.PNG) ── */}
                    <div className="bg-[#254c7f] text-white pt-[max(env(safe-area-inset-top,44px),44px)] sm:pt-4 pb-3 px-5 relative overflow-hidden">
                        {/* Authentic myBCA organic wave background motif */}
                        <img
                            src="/clean-mode/header_bg_motif.png"
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
                        />

                        {/* TOP ACTION ROW (myBCA Logo + CS, Settings, Logout matching CONTOHTAMPILAN.PNG) */}
                        <div className="mt-1 mb-2 flex items-center justify-between relative z-10 px-0">
                            <div className="flex items-center cursor-pointer" onClick={() => showToast('myBCA by Bank Central Asia')}>
                                <img
                                    src="/clean-mode/mybca_logo_hd.png"
                                    alt="myBCA"
                                    className="h-[25px] w-auto object-contain drop-shadow-sm"
                                />
                            </div>

                            <div className="flex items-center gap-[22px]">
                                {/* Headset CS */}
                                <button
                                    onClick={() => showToast('Halo BCA: 1500888')}
                                    className="hover:opacity-80 active:scale-95 transition-all p-0.5"
                                    title="Customer Service"
                                >
                                    <img
                                        src="/clean-mode/header_headset_hd.png"
                                        alt="CS"
                                        className="w-[22px] h-[22px] object-contain drop-shadow-sm"
                                    />
                                </button>

                                {/* Settings / Gear */}
                                <button
                                    onClick={handleOpenSettings}
                                    className="hover:opacity-80 active:scale-95 transition-all p-0.5"
                                    title="Pengaturan Tampilan"
                                >
                                    <img
                                        src="/clean-mode/header_gear_hd.png"
                                        alt="Settings"
                                        className="w-[22px] h-[22px] object-contain drop-shadow-sm"
                                    />
                                </button>

                                {/* Logout Door / Return to Rupiku */}
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="hover:opacity-80 active:scale-95 transition-all p-0.5"
                                    title="Kembali ke Dashboard Utama Rupiku"
                                >
                                    <img
                                        src="/clean-mode/header_logout_hd.png"
                                        alt="Logout"
                                        className="w-[22px] h-[22px] object-contain drop-shadow-sm"
                                    />
                                </button>
                            </div>
                        </div>

                        {/* GREETING STRIP */}
                        <div className="mt-2 mb-2.5 relative z-10 px-0">
                            <p className="text-[11px] tracking-wide text-white">
                                <span className="font-normal text-white/90">HELLO, </span>
                                <span className="font-bold">{userName}</span>
                            </p>
                        </div>

                        {/* PRIMARY ACCOUNT CARD (Entirely enclosed inside Dark Blue Header - Never Cut Off!) */}
                        <div className="relative z-20 rounded-[18px] shadow-lg shadow-black/15 overflow-hidden bg-white">
                            {/* Top Dual-Tone Gradient Strip (#77bcf1 -> #41a2c3 -> #2bb7b9) with Stacked Elements */}
                            <div className="bg-gradient-to-r from-[#77bcf1] via-[#41a2c3] to-[#2bb7b9] px-4 pt-2.5 pb-2.5 flex flex-col gap-1.5 text-white">
                                {/* Row 1: BCA ID pill button (Left-aligned) */}
                                <div>
                                    <div
                                        onClick={() => showToast('BCA ID Aktif')}
                                        className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-2 py-[2px] rounded-full text-[10.5px] font-medium tracking-wide border border-white/40 cursor-pointer active:scale-95 transition-all"
                                    >
                                        <svg className="w-3 h-3 fill-none stroke-white stroke-[2]" viewBox="0 0 24 24">
                                            <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                            <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                            <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                            <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                        </svg>
                                        <span>BCA ID</span>
                                        <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                                    </div>
                                </div>

                                {/* Row 2: Account Number & Copy SVG Icon */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] text-white/95">
                                        Account: <span className="font-bold tracking-wider">{accountNumber}</span>
                                    </span>
                                    <button
                                        onClick={handleCopy}
                                        className="p-0.5 rounded hover:bg-white/20 active:scale-90 transition-transform flex items-center justify-center"
                                        title="Salin Nomor Rekening"
                                    >
                                        {copied ? (
                                            <Check className="w-3 h-3 text-white stroke-[2.5]" />
                                        ) : (
                                            <img
                                                src="/clean-mode/icon_copy_hd.png"
                                                alt="Copy"
                                                className="w-[13.5px] h-[13.5px] object-contain shrink-0"
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Bottom White Card Section */}
                            <div className="px-4 pt-2.5 pb-2.5 bg-white">
                                <p
                                    className="text-[11.5px] font-normal text-[#596066] tracking-tight"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif' }}
                                >
                                    Active Balance
                                </p>
                                <div className="flex items-center justify-between mt-0.5 mb-1.5">
                                    <div className="flex items-baseline gap-2">
                                        <span
                                            className="text-[17.5px] font-extrabold text-[#2c3137] tracking-tight"
                                            style={{
                                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                                fontWeight: 800,
                                                letterSpacing: '-0.02em',
                                            }}
                                        >
                                            {isMasked ? 'IDR ••••••••' : `IDR ${formatBalance(balance)}`}
                                        </span>
                                    </div>

                                    {/* Eye Toggle Icon: Authentic Thicker/Bolder Eye from CONTOHTAMPILAN.PNG */}
                                    <button
                                        onClick={() => setIsMasked(!isMasked)}
                                        className="p-1 rounded-full hover:bg-blue-50 active:scale-90 transition-all flex items-center justify-center"
                                        title={isMasked ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
                                    >
                                        {isMasked ? (
                                            <svg className="w-[19px] h-[14px] text-[#005caa] stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <img
                                                src="/clean-mode/icon_eye_hd.png"
                                                alt="Eye"
                                                className="w-[19px] h-auto object-contain"
                                            />
                                        )}
                                    </button>
                                </div>

                                {/* Hairline Divider */}
                                <div className="border-t border-slate-100 my-2" />

                                {/* Account Transactions Link */}
                                <button
                                    onClick={() => setIsStatementOpen(true)}
                                    className="w-full flex items-center gap-2 text-[#005caa] hover:text-[#004885] active:translate-x-0.5 transition-all text-left"
                                >
                                    <img
                                        src="/clean-mode/icon_account_trans_hd.png"
                                        alt="Transactions"
                                        className="w-[22px] h-[19px] object-contain shrink-0"
                                    />
                                    <span className="text-[12.5px] font-bold">Account Transactions</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── 2. SEPARATOR AD BANNER (Exact full-width seamless transition matching CONTOHTAMPILAN.PNG) ── */}
                    <div
                        onClick={() => showToast('Program Undian myBCA Berhadiah')}
                        className="w-full cursor-pointer active:scale-[0.99] transition-transform select-none block relative z-30"
                    >
                        <img
                            src="/clean-mode/ad_banner_top_full.png"
                            alt="Over 600.000 Prizes Ready to Be Won!"
                            className="w-full h-auto block select-none"
                        />
                    </div>

                    {/* ── 3. LIGHT BLUE CONTENT SECTION (#f3f7fb) ── */}
                    <div className="px-4 pt-1 space-y-3">

                        {/* ── MAIN MENU (Authentic 5-Column Grid with Transparent PNG Icons) ── */}
                        <div className="pt-0.5 pb-1">
                            {/* Main Menu Header */}
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h2 className="text-[17px] font-extrabold text-[#0c3258] tracking-tight">Main Menu</h2>
                                <button
                                    onClick={() => showToast('Menu kustomisasi myBCA')}
                                    className="flex items-center gap-1 text-xs font-bold text-[#0060b2] hover:text-blue-800"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                </button>
                            </div>

                            {/* 5-Column Horizontal Menu (Columns 1-4 full, Column 5 peeking on right edge matching CONTOHTAMPILAN.PNG) */}
                            <div
                                ref={menuScrollRef}
                                onScroll={handleMenuScroll}
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                className="flex gap-2 overflow-x-auto cleanmode-menu-scroll cleanmode-no-scrollbar no-scrollbar pb-1 -mx-4 px-4 scroll-smooth"
                            >
                                {/* Column 1: Transfer & Flazz */}
                                <div className="w-[74px] shrink-0 flex flex-col gap-3.5 items-center text-center">
                                    <div onClick={() => setIsStatementOpen(true)} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-full">
                                        <img src="/clean-mode/menu/icon_transfer.png" alt="Transfer" className="w-[52px] h-[52px] object-contain drop-shadow-sm" />
                                        <div className="h-[28px] flex items-start justify-center text-[11px] font-semibold text-[#2c3e50] leading-[13px] mt-1.5">
                                            <span>Transfer</span>
                                        </div>
                                    </div>
                                    <div onClick={() => showToast('Cek Saldo Flazz via NFC')} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-full">
                                        <img src="/clean-mode/menu/icon_flazz.png" alt="Flazz" className="w-[52px] h-[52px] object-contain drop-shadow-sm" />
                                        <div className="h-[28px] flex items-start justify-center text-[11px] font-semibold text-[#2c3e50] leading-[13px] mt-1.5">
                                            <span>Flazz</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Payment & Top Up & Cardless */}
                                <div className="w-[74px] shrink-0 flex flex-col gap-3.5 items-center text-center">
                                    <div onClick={() => showToast('Pembayaran & Top Up')} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-full">
                                        <img src="/clean-mode/menu/icon_payment.png" alt="Payment & Top Up" className="w-[52px] h-[52px] object-contain drop-shadow-sm" />
                                        <div className="h-[28px] flex items-start justify-center text-[11px] font-semibold text-[#2c3e50] leading-[13px] mt-1.5">
                                            <span>Payment &<br />Top Up</span>
                                        </div>
                                    </div>
                                    <div onClick={() => showToast('Tarik Tunai Tanpa Kartu')} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-full">
                                        <img src="/clean-mode/menu/icon_cardless.png" alt="Cardless" className="w-[52px] h-[52px] object-contain drop-shadow-sm" />
                                        <div className="h-[28px] flex items-start justify-center text-[11px] font-semibold text-[#2c3e50] leading-[13px] mt-1.5">
                                            <span>Cardless</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Investment & Bank Products */}
                                <div className="w-[74px] shrink-0 flex flex-col gap-3.5 items-center text-center">
                                    <div onClick={() => navigate('/trading')} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-full">
                                        <img src="/clean-mode/menu/icon_investment.png" alt="Investment" className="w-[52px] h-[52px] object-contain drop-shadow-sm" />
                                        <div className="h-[28px] flex items-start justify-center text-[11px] font-semibold text-[#2c3e50] leading-[13px] mt-1.5">
                                            <span>Investment</span>
                                        </div>
                                    </div>
                                    <div onClick={() => showToast('Produk Perbankan BCA')} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-full">
                                        <img src="/clean-mode/menu/icon_bank_products.png" alt="Bank Products" className="w-[52px] h-[52px] object-contain drop-shadow-sm" />
                                        <div className="h-[28px] flex items-start justify-center text-[11px] font-semibold text-[#2c3e50] leading-[13px] mt-1.5">
                                            <span>Bank<br />Products</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 4: Lifestyle & Protection */}
                                <div className="w-[74px] shrink-0 flex flex-col gap-3.5 items-center text-center">
                                    <div onClick={() => navigate('/split-bill')} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-full">
                                        <img src="/clean-mode/menu/icon_lifestyle.png" alt="Lifestyle" className="w-[52px] h-[52px] object-contain drop-shadow-sm" />
                                        <div className="h-[28px] flex items-start justify-center text-[11px] font-semibold text-[#2c3e50] leading-[13px] mt-1.5">
                                            <span>Lifestyle</span>
                                        </div>
                                    </div>
                                    <div onClick={() => showToast('Asuransi Proteksi BCA')} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-full">
                                        <img src="/clean-mode/menu/icon_protection.png" alt="Protection" className="w-[52px] h-[52px] object-contain drop-shadow-sm" />
                                        <div className="h-[28px] flex items-start justify-center text-[11px] font-semibold text-[#2c3e50] leading-[13px] mt-1.5">
                                            <span>Protection</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 5: e-Statements & All Menus (Peeking on right edge, uncropped authentic assets) */}
                                <div className="w-[74px] shrink-0 flex flex-col gap-3.5 items-center text-center">
                                    <div onClick={() => setIsStatementOpen(true)} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-full">
                                        <img src="/clean-mode/menu/icon_statement.png" alt="e-Statements" className="w-[52px] h-[52px] object-contain drop-shadow-sm" />
                                        <div className="h-[28px] flex items-start justify-center text-[11px] font-semibold text-[#2c3e50] leading-[13px] mt-1.5">
                                            <span>e-Statements</span>
                                        </div>
                                    </div>
                                    <div onClick={() => showToast('Semua Menu')} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-full">
                                        <img src="/clean-mode/menu/icon_all_menu.png" alt="All Menus" className="w-[52px] h-[52px] object-contain drop-shadow-sm" />
                                        <div className="h-[28px] flex items-start justify-center text-[11px] font-semibold text-[#2c3e50] leading-[13px] mt-1.5">
                                            <span>All Menus</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Authentic Interactive Carousel Indicator (< [cyan pill] [grey pill] > matching CONTOHTAMPILAN.PNG) */}
                            <div className="flex justify-center items-center gap-1.5 mt-2.5 mb-1 select-none">
                                {/* Left Chevron Button */}
                                <button
                                    onClick={handleScrollLeft}
                                    className="p-1 text-[#00a2e8] hover:text-[#008bc7] active:scale-90 transition-transform flex items-center justify-center cursor-pointer"
                                    title="Menu Sebelumnya"
                                    aria-label="Scroll menu left"
                                >
                                    <svg className="w-2.5 h-2.5 fill-none stroke-[#00a2e8] stroke-[3] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>

                                {/* Dual-Part Pill Indicator Capsule */}
                                <div
                                    className="flex items-center h-[4.5px] rounded-full overflow-hidden cursor-pointer"
                                    onClick={() => (menuPage === 0 ? handleScrollRight() : handleScrollLeft())}
                                    title="Ganti Halaman Menu"
                                >
                                    <div
                                        className={`h-[4.5px] w-4 rounded-l-full transition-colors duration-300 ${
                                            menuPage === 0 ? 'bg-[#00a2e8]' : 'bg-[#d6dbe1]'
                                        }`}
                                    />
                                    <div
                                        className={`h-[4.5px] w-4 rounded-r-full transition-colors duration-300 ${
                                            menuPage === 1 ? 'bg-[#00a2e8]' : 'bg-[#d6dbe1]'
                                        }`}
                                    />
                                </div>

                                {/* Right Chevron Button */}
                                <button
                                    onClick={handleScrollRight}
                                    className="p-1 text-[#00a2e8] hover:text-[#008bc7] active:scale-90 transition-transform flex items-center justify-center cursor-pointer"
                                    title="Menu Selanjutnya"
                                    aria-label="Scroll menu right"
                                >
                                    <svg className="w-2.5 h-2.5 fill-none stroke-[#00a2e8] stroke-[3] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* PROMO BANNER 2 ("Pay 1 Get 2" Doodle Aliens matching CONTOHTAMPILAN.PNG) */}
                        <div
                            onClick={() => showToast('Promo Pay 1 Get 2 myBCA')}
                            className="cursor-pointer active:scale-[0.99] transition-transform rounded-2xl overflow-hidden shadow-sm mt-2 mb-4"
                        >
                            <img
                                src="/clean-mode/banner_aliens_exact.png"
                                alt="Pay 1 Get 2"
                                className="w-full object-contain rounded-2xl block"
                            />
                        </div>
                    </div>
                </div>

                {/* ── 4. SIGNATURE FLOATING BOTTOM DOCK NAVBAR (Exact 1:1 Matching CONTOHTAMPILAN.PNG) ── */}
                <div className="absolute bottom-0 left-0 right-0 z-40 bg-[#005caa] text-white shadow-[0_-5px_25px_rgba(0,0,0,0.18)] pb-[env(safe-area-inset-bottom)] rounded-t-[24px] sm:rounded-b-[32px]">
                    <div className="flex items-center justify-between px-2 pt-1 pb-1.5 relative h-[68px]">

                        {/* Tab 1: Home */}
                        <button
                            onClick={() => setActiveTab('home')}
                            className={`flex-1 flex flex-col items-center justify-center bg-transparent active:scale-95 transition-transform ${activeTab === 'home' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                            title="Home"
                        >
                            <img src="/clean-mode/dock_tab_home.png" alt="Home" className="h-[40px] w-auto object-contain" />
                        </button>

                        {/* Tab 2: Activity */}
                        <button
                            onClick={() => {
                                setActiveTab('activity');
                                setIsStatementOpen(true);
                            }}
                            className={`flex-1 flex flex-col items-center justify-center bg-transparent active:scale-95 transition-transform ${activeTab === 'activity' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                            title="Activity"
                        >
                            <img src="/clean-mode/dock_tab_activity.png" alt="Activity" className="h-[40px] w-auto object-contain" />
                        </button>

                        {/* Tab 3: Center Floating Elevated QRIS Action Button */}
                        <div className="flex-1 flex flex-col items-center relative -top-[18px]">
                            <button
                                onClick={() => navigate('/split-bill')}
                                className="active:scale-95 transition-transform flex flex-col items-center group bg-transparent focus:outline-none"
                                title="Scan QRIS"
                            >
                                <img
                                    src="/clean-mode/nav_qris_pebble.png"
                                    alt="QRIS"
                                    className="w-[52px] h-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.28)]"
                                />
                                <img
                                    src="/clean-mode/nav_qris_text.png"
                                    alt="QRIS Logo"
                                    className="h-[14.5px] w-auto object-contain mt-1 drop-shadow-sm"
                                />
                            </button>
                        </div>

                        {/* Tab 4: For You */}
                        <button
                            onClick={() => {
                                setActiveTab('foryou');
                                showToast('Fitur Promo & Rewards myBCA');
                            }}
                            className={`flex-1 flex flex-col items-center justify-center bg-transparent active:scale-95 transition-transform ${activeTab === 'foryou' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                            title="For You"
                        >
                            <img src="/clean-mode/dock_tab_foryou.png" alt="For You" className="h-[40px] w-auto object-contain" />
                        </button>

                        {/* Tab 5: My Account */}
                        <button
                            onClick={() => {
                                setActiveTab('account');
                                handleOpenSettings();
                            }}
                            className={`flex-1 flex flex-col items-center justify-center bg-transparent active:scale-95 transition-transform ${activeTab === 'account' ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                            title="My Account"
                        >
                            <img src="/clean-mode/dock_tab_account.png" alt="My Account" className="h-[40px] w-auto object-contain" />
                        </button>
                    </div>
                </div>

                {/* ── 8. TOAST NOTIFICATION ── */}
                <AnimatePresence>
                    {toastMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-16 left-4 right-4 z-50 bg-slate-900/90 text-white text-xs font-medium py-2.5 px-4 rounded-xl shadow-xl backdrop-blur-md text-center border border-white/10"
                        >
                            {toastMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── 9. SETTINGS & CUSTOMIZE MODAL ── */}
                <AnimatePresence>
                    {isSettingsOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-base text-slate-900">Pengaturan Clean Mode</h3>
                                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3.5 text-xs">
                                    <div>
                                        <label className="block text-slate-500 font-medium mb-1">Nama Tampilan</label>
                                        <input
                                            type="text"
                                            value={customNameInput}
                                            onChange={e => setCustomNameInput(e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#005caa]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-500 font-medium mb-1">Nomor Rekening Tampilan</label>
                                        <input
                                            type="text"
                                            value={customAccountInput}
                                            onChange={e => setCustomAccountInput(e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#005caa]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-500 font-medium mb-1">Nominal Saldo (IDR)</label>
                                        <input
                                            type="number"
                                            value={customBalanceInput}
                                            onChange={e => setCustomBalanceInput(e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#005caa]"
                                        />
                                    </div>

                                    <div className="pt-2 flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCustomNameInput('AHMAD FIKRI RAFI UDDIN');
                                                setCustomAccountInput('801 - 040 - 1811');
                                                setCustomBalanceInput('529265.71');
                                            }}
                                            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#005caa] rounded-xl font-semibold text-xs transition-colors border border-blue-200 text-center"
                                        >
                                            Salin Nilai Contoh Acuan (529.265,71)
                                        </button>

                                        <button
                                            onClick={handleSaveCustomSettings}
                                            className="w-full py-2.5 bg-[#005caa] text-white rounded-xl font-bold text-xs hover:bg-[#004b9c] transition-colors shadow-md shadow-blue-900/20"
                                        >
                                            Simpan Perubahan
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsSettingsOpen(false);
                                                navigate('/dashboard');
                                            }}
                                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" />
                                            <span>Kembali ke Dashboard Rupiku</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── 10. BCA STATEMENT MODAL ── */}
                <BcaStatementModal
                    isOpen={isStatementOpen}
                    onClose={() => setIsStatementOpen(false)}
                    accountNumber={accountNumber}
                    accountName={userName}
                    currentBalance={balance}
                />
            </div>
        </div>
    );
};

export default CleanMode;
