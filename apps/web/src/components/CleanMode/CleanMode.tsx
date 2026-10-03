import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, SlidersHorizontal, ArrowLeft, X, Settings, Plus, Trash2, RotateCcw } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { authService } from '../../services/authService';
import BcaStatementModal from './BcaStatementModal';

const INDO_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const getRecentMonths = (count = 5): string[] => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        list.push(`${INDO_MONTHS[d.getMonth()]} ${d.getFullYear()}`);
    }
    return list;
};

export interface SpendingCategory {
    id: string;
    name: string;
    amount: number;
    color: string;
    icon: 'grid' | 'shopping' | 'food' | 'admin' | 'bill' | 'transport' | 'heart' | 'custom';
}

export const DEFAULT_SPENDING_CATEGORIES: SpendingCategory[] = [
    {
        id: 'misc',
        name: 'Miscellaneous',
        amount: 80310,
        color: '#00a8ea',
        icon: 'grid',
    },
    {
        id: 'shopping',
        name: 'Shopping',
        amount: 50000,
        color: '#c86573',
        icon: 'shopping',
    },
    {
        id: 'food',
        name: 'Food & Beverage',
        amount: 31000,
        color: '#e5b34e',
        icon: 'food',
    },
    {
        id: 'admin',
        name: 'Admin Fee',
        amount: 20000,
        color: '#9b629b',
        icon: 'admin',
    },
];

export const CATEGORY_COLORS = [
    '#00a8ea', // Cyan
    '#c86573', // Rose Coral
    '#e5b34e', // Mustard
    '#9b629b', // Purple
    '#48bb78', // Emerald Green
    '#ed8936', // Amber Orange
    '#3182ce', // Royal Blue
    '#e53e3e', // Crimson Red
    '#38b2ac', // Teal
    '#805ad5', // Deep Violet
];

export const formatFdAmount = (num: number): string => {
    if (!num || isNaN(num) || num <= 0) return 'IDR 0';
    if (num >= 1000000) {
        const val = num / 1000000;
        const formatted = val % 1 === 0 ? val.toString() : val.toFixed(2).replace('.', ',').replace(/,?0+$/, '');
        return `IDR ${formatted} M`;
    }
    if (num >= 1000) {
        const val = num / 1000;
        const formatted = val % 1 === 0 ? val.toString() : val.toFixed(2).replace('.', ',').replace(/,?0+$/, '');
        return `IDR ${formatted} K`;
    }
    return `IDR ${Math.round(num)}`;
};

const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: cx + r * Math.cos(angleInRadians),
        y: cy + r * Math.sin(angleInRadians),
    };
};

const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const angleDiff = endAngle - startAngle;
    const largeArcFlag = angleDiff > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const renderCategoryIcon = (icon: SpendingCategory['icon'], color: string) => {
    switch (icon) {
        case 'grid':
            return (
                <svg viewBox="0 0 14 14" className="w-[14px] h-[14px]">
                    <rect x="1" y="1" width="5.2" height="5.2" rx="1.2" fill={color} />
                    <rect x="7.8" y="1" width="5.2" height="5.2" rx="1.2" fill={color} />
                    <rect x="1" y="7.8" width="5.2" height="5.2" rx="1.2" fill={color} />
                    <rect x="7.8" y="7.8" width="5.2" height="5.2" rx="1.2" fill={color} />
                </svg>
            );
        case 'shopping':
            return (
                <svg viewBox="0 0 14 14" className="w-[14px] h-[14px]">
                    <path
                        d="M2.5 5h9a.8.8 0 0 1 .8.9l-.7 6a1 1 0 0 1-1 .9H3.4a1 1 0 0 1-1-.9l-.7-6a.8.8 0 0 1 .8-.9z"
                        fill={color}
                    />
                    <path
                        d="M5 5V3.2a2 2 0 0 1 4 0V5"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                    />
                    <circle cx="7" cy="8" r="1.1" fill="#ffffff" />
                </svg>
            );
        case 'food':
            return (
                <svg viewBox="0 0 14 14" className="w-[14px] h-[14px]">
                    <path
                        d="M2 7.2C2 4.2 4.2 3 7 3s5 1.2 5 4.2c0 1.5-.7 2.6-1.6 2.6H3.6C2.7 9.8 2 8.7 2 7.2z"
                        fill={color}
                    />
                    <path
                        d="M4.5 4.8l.8 2.2M7 4.5v2.5M9.5 4.8l-.8 2.2"
                        stroke="#ffffff"
                        strokeWidth="0.9"
                        strokeLinecap="round"
                    />
                </svg>
            );
        case 'admin':
            return (
                <svg viewBox="0 0 14 14" className="w-[14px] h-[14px]">
                    <circle cx="7" cy="4.2" r="2.2" fill={color} />
                    <path
                        d="M3 11.2c0-2.2 1.8-3.6 4-3.6s4 1.4 4 3.6c0 .4-.3.6-.7.6H3.7c-.4 0-.7-.2-.7-.6z"
                        fill={color}
                    />
                </svg>
            );
        case 'bill':
            return (
                <svg viewBox="0 0 14 14" className="w-[14px] h-[14px]">
                    <path
                        d="M3 1.5h8a.8.8 0 0 1 .8.8v10.2l-1.8-.9-1.8.9-1.4-.9-1.8.9-1.8-.9-1 .5V2.3a.8.8 0 0 1 .8-.8z"
                        fill={color}
                    />
                    <path d="M4.5 4.5h5m-5 2.5h5m-5 2.5h3" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
                </svg>
            );
        case 'transport':
            return (
                <svg viewBox="0 0 14 14" className="w-[14px] h-[14px]">
                    <path
                        d="M2.5 6.5L4 3.2a.8.8 0 0 1 .7-.4h4.6a.8.8 0 0 1 .7.4l1.5 3.3v4a.8.8 0 0 1-.8.8h-.8a.8.8 0 0 1-.8-.8v-.5H4.9v.5a.8.8 0 0 1-.8.8h-.8a.8.8 0 0 1-.8-.8v-4z"
                        fill={color}
                    />
                    <circle cx="4.5" cy="8" r="1.1" fill="#ffffff" />
                    <circle cx="9.5" cy="8" r="1.1" fill="#ffffff" />
                </svg>
            );
        case 'heart':
            return (
                <svg viewBox="0 0 14 14" className="w-[14px] h-[14px]">
                    <path
                        d="M7 12s-4.8-3.3-4.8-6.6a2.8 2.8 0 0 1 4.8-2 2.8 2.8 0 0 1 4.8 2C11.8 8.7 7 12 7 12z"
                        fill={color}
                    />
                </svg>
            );
        default:
            return (
                <svg viewBox="0 0 14 14" className="w-[14px] h-[14px]">
                    <circle cx="7" cy="7" r="5" fill={color} />
                    <circle cx="7" cy="7" r="2" fill="#ffffff" />
                </svg>
            );
    }
};

interface SpendingDonutChartProps {
    categories: SpendingCategory[];
    selectedCategoryId: string | null;
    onSelectCategory: (id: string | null) => void;
    isMasked: boolean;
    onToggleMask: () => void;
}

const SpendingDonutChart: React.FC<SpendingDonutChartProps> = ({
    categories,
    selectedCategoryId,
    onSelectCategory,
    isMasked,
    onToggleMask,
}) => {
    const totalSpending = useMemo(() => {
        return categories.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    }, [categories]);

    const selectedCategory = useMemo(() => {
        return categories.find((c) => c.id === selectedCategoryId) || null;
    }, [categories, selectedCategoryId]);

    const selectedPercent = useMemo(() => {
        if (!selectedCategory || totalSpending <= 0) return 0;
        return Math.round((selectedCategory.amount / totalSpending) * 100);
    }, [selectedCategory, totalSpending]);

    const segments = useMemo(() => {
        if (totalSpending <= 0 || categories.length === 0) return [];
        const hasMultiple = categories.length > 1;
        const gapDegrees = hasMultiple ? 2.5 : 0;
        let currentAngle = 0;

        return categories.map((cat) => {
            const fraction = Math.max(0, cat.amount) / totalSpending;
            const sweepAngle = fraction * 360;
            const arcStart = currentAngle + (hasMultiple ? gapDegrees / 2 : 0);
            const arcEnd = currentAngle + sweepAngle - (hasMultiple ? gapDegrees / 2 : 0);
            const midAngle = currentAngle + sweepAngle / 2;
            const badgePos = polarToCartesian(110, 110, 88, midAngle);
            const isSingle = categories.length === 1 || fraction >= 0.999;
            const isSelected = selectedCategoryId === cat.id;

            currentAngle += sweepAngle;

            return {
                ...cat,
                fraction,
                sweepAngle,
                arcStart,
                arcEnd,
                midAngle,
                badgePos,
                isSingle,
                isSelected,
                d: isSingle
                    ? describeArc(110, 110, 88, 0, 359.99)
                    : describeArc(110, 110, 88, arcStart, arcEnd),
            };
        });
    }, [categories, totalSpending, selectedCategoryId]);

    return (
        <div className="relative w-[220px] h-[220px] mx-auto flex items-center justify-center my-3.5 select-none">
            {/* SVG Donut Chart */}
            <svg
                viewBox="0 0 220 220"
                className="w-full h-full overflow-visible"
                style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.04))' }}
            >
                {/* Background track if empty */}
                {totalSpending <= 0 && (
                    <circle
                        cx="110"
                        cy="110"
                        r="88"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="14"
                    />
                )}

                {/* Arc Segments */}
                {segments.map((seg) => {
                    const isMuted = selectedCategoryId !== null && selectedCategoryId !== seg.id;
                    return (
                        <path
                            key={`arc-${seg.id}`}
                            d={seg.d}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="14"
                            strokeLinecap="butt"
                            opacity={isMuted ? 0.38 : 1}
                            className="transition-all duration-300 cursor-pointer hover:opacity-90"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectCategory(seg.isSelected ? null : seg.id);
                            }}
                        />
                    );
                })}

                {/* Badges on the Ring */}
                {segments.map((seg) => {
                    const isMuted = selectedCategoryId !== null && selectedCategoryId !== seg.id;
                    return (
                        <g
                            key={`badge-${seg.id}`}
                            className="cursor-pointer transition-all duration-200"
                            style={{
                                transformOrigin: `${seg.badgePos.x}px ${seg.badgePos.y}px`,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectCategory(seg.isSelected ? null : seg.id);
                            }}
                        >
                            {/* White Circular Badge */}
                            <circle
                                cx={seg.badgePos.x}
                                cy={seg.badgePos.y}
                                r="13"
                                fill="#ffffff"
                                stroke={seg.isSelected ? seg.color : '#dce3ec'}
                                strokeWidth={seg.isSelected ? '1.8' : '1.2'}
                                opacity={isMuted ? 0.85 : 1}
                                style={{
                                    filter: seg.isSelected
                                        ? `drop-shadow(0 2px 6px ${seg.color}55)`
                                        : 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))',
                                }}
                            />
                            {/* Category Icon */}
                            <g
                                transform={`translate(${seg.badgePos.x - 7}, ${seg.badgePos.y - 7})`}
                                opacity={isMuted ? 0.85 : 1}
                            >
                                {renderCategoryIcon(seg.icon, seg.color)}
                            </g>
                        </g>
                    );
                })}
            </svg>

            {/* Center Information Display */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center select-none cursor-pointer"
                style={{
                    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                }}
                onClick={() => {
                    if (selectedCategoryId !== null) {
                        onSelectCategory(null);
                    }
                }}
                title={selectedCategoryId ? 'Klik tengah untuk kembali ke Total Spending' : undefined}
            >
                {selectedCategory ? (
                    <>
                        <span
                            style={{
                                fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                                fontSize: '16px',
                                fontWeight: 800,
                                color: '#00a2e8',
                                lineHeight: '1.2',
                                letterSpacing: '-0.01em',
                                display: 'block',
                            }}
                        >
                            {selectedPercent}%
                        </span>
                        <span
                            style={{
                                fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                                fontSize: '14.5px',
                                fontWeight: 600,
                                color: '#2c3e50',
                                lineHeight: '1.2',
                                letterSpacing: '-0.01em',
                                display: 'block',
                                marginTop: '2px',
                                maxWidth: '110px',
                                whiteSpace: 'pre-line',
                            }}
                        >
                            {selectedCategory.name.includes('&')
                                ? selectedCategory.name.replace('&', '&\n')
                                : selectedCategory.name}
                        </span>
                        <span
                            style={{
                                fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                                fontSize: '16px',
                                fontWeight: 700,
                                color: '#144e83',
                                lineHeight: '1.2',
                                letterSpacing: '-0.01em',
                                display: 'block',
                                marginTop: '4px',
                            }}
                        >
                            {isMasked ? 'IDR ******' : formatFdAmount(selectedCategory.amount)}
                        </span>
                    </>
                ) : (
                    <>
                        <span
                            style={{
                                fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#495057',
                                lineHeight: '1.2',
                                letterSpacing: '-0.01em',
                                display: 'block',
                            }}
                        >
                            Total
                        </span>
                        <span
                            style={{
                                fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#495057',
                                lineHeight: '1.2',
                                letterSpacing: '-0.01em',
                                display: 'block',
                                marginTop: '2px',
                            }}
                        >
                            Spending
                        </span>
                        <span
                            style={{
                                fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                                fontSize: '16.5px',
                                fontWeight: 700,
                                color: '#144e83',
                                lineHeight: '1.2',
                                letterSpacing: '-0.01em',
                                display: 'block',
                                marginTop: '6px',
                            }}
                        >
                            {isMasked ? 'IDR ******' : formatFdAmount(totalSpending)}
                        </span>
                    </>
                )}

                {/* Eye Mask Toggle Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleMask();
                    }}
                    className="mt-2.5 w-[42px] h-[30px] rounded-[6px] border border-[#dce3ea] bg-[#f3f6f9] hover:bg-[#ebf0f5] active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                    title={isMasked ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
                    aria-label="Toggle nominal visibility"
                >
                    {isMasked ? (
                        <svg className="w-[18px] h-[18px] stroke-[#7c8a9c] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                    ) : (
                        <svg className="w-[18px] h-[18px] stroke-[#7c8a9c] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export const CleanMode: React.FC = () => {
    const navigate = useNavigate();

    // Core States with LocalStorage Persistence (Preserves edited settings across app restarts)
    const [balance, setBalance] = useState<number>(() => {
        const saved = localStorage.getItem('clean_mode_balance');
        if (saved !== null && !isNaN(Number(saved))) {
            return Number(saved);
        }
        return 529265.71;
    });
    const [isMasked, setIsMasked] = useState<boolean>(() => {
        return localStorage.getItem('clean_mode_balance_masked') === 'true';
    });
    const [userName, setUserName] = useState<string>(() => {
        return localStorage.getItem('clean_mode_user_name') || 'AHMAD FIKRI RAFI UDDIN';
    });
    const [accountNumber, setAccountNumber] = useState<string>(() => {
        return localStorage.getItem('clean_mode_account_number') || '801 - 040 - 1811';
    });
    const [copied, setCopied] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Modals
    const [isStatementOpen, setIsStatementOpen] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [customNameInput, setCustomNameInput] = useState<string>('');
    const [customAccountInput, setCustomAccountInput] = useState<string>('');
    const [customBalanceInput, setCustomBalanceInput] = useState<string>('');

    // Pockets & Card Tab States (1:1 myBCA)
    const [pocketTab, setPocketTab] = useState<'rupiah' | 'forex'>('rupiah');
    const [cardTab, setCardTab] = useState<'debit' | 'credit'>('debit');

    // Financial Diary State (Exact 1:1 Matching myBCA)
    const [fdSlide, setFdSlide] = useState<number>(0);
    const [fdMasked, setFdMasked] = useState<boolean>(() => {
        return localStorage.getItem('clean_mode_fd_masked') !== 'false';
    });
    const availableMonths = getRecentMonths(5);
    const [selectedMonth, setSelectedMonth] = useState<string>(() => availableMonths[0]);
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState<boolean>(false);

    // Spending Categories & Donut Selection (Exact 1:1 Matching myBCA)
    const [spendingCategories, setSpendingCategories] = useState<SpendingCategory[]>(() => {
        try {
            const saved = localStorage.getItem('clean_mode_spending_categories');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.warn('Failed to parse clean_mode_spending_categories', e);
        }
        return DEFAULT_SPENDING_CATEGORIES;
    });

    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Compute live total spending
    const totalSpending = useMemo(() => {
        return spendingCategories.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    }, [spendingCategories]);

    const fdSpendingAmount = useMemo(() => {
        return formatFdAmount(totalSpending);
    }, [totalSpending]);

    const [customCategories, setCustomCategories] = useState<SpendingCategory[]>(spendingCategories);

    // Dynamic FD Nominals with LocalStorage Persistence
    const [fdEarningAmount, setFdEarningAmount] = useState<string>(() => {
        return localStorage.getItem('clean_mode_fd_earning') || 'IDR 1 M';
    });
    const [fdCashflowAmount, setFdCashflowAmount] = useState<string>(() => {
        return localStorage.getItem('clean_mode_fd_cashflow') || 'IDR 221,73 K';
    });

    const [customEarningInput, setCustomEarningInput] = useState<string>('');
    const [customCashflowInput, setCustomCashflowInput] = useState<string>('');

    const fdSlides = [
        {
            title: 'Total Spending',
            label: 'Spending',
            amount: fdSpendingAmount,
            ringImg: '/clean-mode/fd_ring_spending.png',
        },
        {
            title: 'Total Earning',
            label: 'Earning',
            amount: fdEarningAmount,
            ringImg: '/clean-mode/fd_ring_earning.png',
        },
        {
            title: 'Total Cashflow',
            label: 'Cashflow',
            amount: fdCashflowAmount,
            ringImg: '/clean-mode/fd_ring_cashflow.png',
        },
    ];

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
        // Enforce Admin-only access
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            navigate('/dashboard', { replace: true });
            return;
        }

        // Only set default userName from user.name if no custom clean_mode_user_name is saved in localStorage
        const savedName = localStorage.getItem('clean_mode_user_name');
        if (!savedName && user?.name) {
            setUserName(user.name.toUpperCase());
        }

        // Fetch real balance from Rupiku only if no custom clean_mode_balance is saved in localStorage
        const fetchBalance = async () => {
            const savedBalance = localStorage.getItem('clean_mode_balance');
            if (savedBalance !== null && !isNaN(Number(savedBalance))) {
                return;
            }
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
        if (metaTheme) metaTheme.setAttribute('content', '#0f4277');

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

    const handleToggleMask = () => {
        setIsMasked(prev => {
            const next = !prev;
            localStorage.setItem('clean_mode_balance_masked', String(next));
            return next;
        });
    };

    const handleToggleFdMask = () => {
        setFdMasked(prev => {
            const next = !prev;
            localStorage.setItem('clean_mode_fd_masked', String(next));
            return next;
        });
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
        setCustomCategories(JSON.parse(JSON.stringify(spendingCategories)));
        setCustomEarningInput(fdEarningAmount);
        setCustomCashflowInput(fdCashflowAmount);
        setIsSettingsOpen(true);
    };

    const handleAddCategory = () => {
        const nextColor = CATEGORY_COLORS[customCategories.length % CATEGORY_COLORS.length];
        const newCat: SpendingCategory = {
            id: `cat_${Date.now()}`,
            name: 'Kategori Lain',
            amount: 10000,
            color: nextColor,
            icon: 'custom',
        };
        setCustomCategories([...customCategories, newCat]);
    };

    const cleanFdAmount = (val: string) => {
        const trimmed = val.trim();
        if (!trimmed) return '';
        return trimmed.startsWith('IDR') ? trimmed : `IDR ${trimmed}`;
    };

    const handleSaveCustomSettings = () => {
        if (customNameInput.trim()) {
            const val = customNameInput.trim().toUpperCase();
            setUserName(val);
            localStorage.setItem('clean_mode_user_name', val);
        }
        if (customAccountInput.trim()) {
            const val = customAccountInput.trim();
            setAccountNumber(val);
            localStorage.setItem('clean_mode_account_number', val);
        }
        if (customBalanceInput.trim()) {
            const cleanNum = customBalanceInput.replace(/[^0-9.]/g, '');
            const parsed = parseFloat(cleanNum);
            if (!isNaN(parsed)) {
                setBalance(parsed);
                localStorage.setItem('clean_mode_balance', String(parsed));
            }
        }
        // Save spending categories
        setSpendingCategories(customCategories);
        localStorage.setItem('clean_mode_spending_categories', JSON.stringify(customCategories));
        const customTotal = customCategories.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        localStorage.setItem('clean_mode_fd_spending', formatFdAmount(customTotal));

        if (customEarningInput.trim()) {
            const val = cleanFdAmount(customEarningInput);
            setFdEarningAmount(val);
            localStorage.setItem('clean_mode_fd_earning', val);
        }
        if (customCashflowInput.trim()) {
            const val = cleanFdAmount(customCashflowInput);
            setFdCashflowAmount(val);
            localStorage.setItem('clean_mode_fd_cashflow', val);
        }
        setIsSettingsOpen(false);
        showToast('Pengaturan tampilan berhasil disimpan secara permanen!');
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

            {/* ── PERSISTENT TOP NAVIGATION HEADER (1:1 Authentic myBCA Header with Seamless Continuous Motif & Curved Bottom Corners) ── */}
            <div
                className="absolute top-0 left-0 right-0 z-40 select-none"
                style={{
                    backgroundImage: `url('/clean-mode/mybca_master_clean_bg.png')`,
                    backgroundSize: '100% auto',
                    backgroundPosition: 'top center',
                    backgroundColor: '#0f4277',
                }}
            >
                {/* Persistent Top Action Row (myBCA Logo + CS, Settings, Logout) - Always pinned in exact native position */}
                <div className="pt-[max(env(safe-area-inset-top,44px),44px)] sm:pt-4 pb-2.5 px-5 flex items-center justify-between relative z-10 pointer-events-auto">
                    {/* myBCA Logo */}
                    <div
                        className="flex items-center cursor-pointer active:scale-95 transition-transform -ml-2"
                        onClick={() => showToast('myBCA by Bank Central Asia')}
                    >
                        <img
                            src="/clean-mode/mybca_logo_hd.png"
                            alt="myBCA"
                            className="h-[25px] w-auto object-contain drop-shadow-sm"
                        />
                    </div>

                    {/* 3 Action Icons (CS, Settings, Logout) */}
                    <div className="flex items-center gap-[22px] -mr-1">
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

                {/* ── Authentic Curved Corner Wedges (Exact matching SS 2 Downward Corner Fillet R=18px) ── */}
                {/* Left Corner Wedge (fillet R=18px) */}
                <svg
                    className="absolute left-0 -bottom-[18px] w-[18px] h-[18px] pointer-events-none fill-[#134e84] z-10"
                    viewBox="0 0 18 18"
                >
                    <path d="M 0,0 L 0,18 A 18,18 0 0,1 18,0 Z" />
                </svg>
                {/* Right Corner Wedge (fillet R=18px) */}
                <svg
                    className="absolute right-0 -bottom-[18px] w-[18px] h-[18px] pointer-events-none fill-[#134e84] z-10"
                    viewBox="0 0 18 18"
                >
                    <path d="M 18,0 L 18,18 A 18,18 0 0,0 0,0 Z" />
                </svg>
            </div>

            {/* ── SCROLLABLE APP BODY (Containing Navy Header + Cards + Banners + Menu) ── */}
            <div
                className="flex-1 overflow-y-auto cleanmode-no-scrollbar no-scrollbar pb-28 relative z-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >

                    {/* ── 1. DEEP NAVY BLUE HEADER & CARD SECTION (Exact matching SS 3 & Native Video) ── */}
                    <div
                        className="text-white pt-[calc(max(env(safe-area-inset-top,44px),44px)+50px)] sm:pt-[76px] pb-3 px-4 relative overflow-hidden"
                        style={{
                            backgroundImage: `url('/clean-mode/mybca_master_clean_bg.png')`,
                            backgroundSize: '100% auto',
                            backgroundPosition: 'top center',
                            backgroundColor: '#0f4277',
                        }}
                    >

                        {/* GREETING STRIP */}
                        <div className="mt-2.5 mb-2.5 relative z-10 pl-1.5 pr-0">
                            <p className="text-[11px] tracking-wide text-white">
                                <span className="font-normal text-white/90">HELLO, </span>
                                <span className="font-bold">{userName}</span>
                            </p>
                        </div>

                        {/* PRIMARY ACCOUNT CARD (Entirely enclosed inside Dark Blue Header - Never Cut Off!) */}
                        <div className="relative z-20 rounded-[20px] shadow-lg shadow-black/15 overflow-hidden bg-white">
                            {/* Top Dual-Tone Gradient Strip (Matching Authentic myBCA Sky Blue to Turquoise) */}
                            <div className="bg-gradient-to-r from-[#75bbee] via-[#3da0c1] to-[#29b9b7] px-5 pt-3 pb-3 flex flex-col gap-2 text-white">
                                {/* Row 1: BCA ID pill button (Left-aligned) */}
                                <div>
                                    <div
                                        onClick={() => showToast('BCA ID Aktif')}
                                        className="inline-flex items-center gap-1.5 bg-transparent hover:bg-white/10 px-2 py-[2px] rounded-full text-[10.5px] font-medium tracking-wide border border-white/60 cursor-pointer active:scale-95 transition-all"
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
                                    <span
                                        className="text-[12.5px] text-white tracking-wide"
                                        style={{
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Account: {accountNumber}
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
                            <div className="px-5 pt-3.5 pb-3 bg-white">
                                <p
                                    className="text-[12px] font-normal text-[#53575a] tracking-tight"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif' }}
                                >
                                    Active Balance
                                </p>
                                <div className="flex items-center justify-between mt-2 mb-2.5">
                                    <div className="flex items-baseline gap-2">
                                        <span
                                            className="text-[18.5px] font-extrabold text-[#4a4f56] tracking-tight"
                                            style={{
                                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
                                                fontWeight: 800,
                                                letterSpacing: '-0.02em',
                                                color: '#4a4f56',
                                            }}
                                        >
                                            {isMasked ? 'IDR ••••••••' : `IDR ${formatBalance(balance)}`}
                                        </span>
                                    </div>

                                    {/* Eye Toggle Icon: Authentic Thicker/Bolder Eye from CONTOHTAMPILAN.PNG */}
                                    <button
                                        onClick={handleToggleMask}
                                        className="p-0.5 rounded-full hover:bg-blue-50 active:scale-90 transition-all flex items-center justify-center -mr-1"
                                        title={isMasked ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
                                    >
                                        {isMasked ? (
                                            <svg className="w-[22px] h-[16px] text-[#005caa] stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <img
                                                src="/clean-mode/icon_eye_hd.png"
                                                alt="Eye"
                                                className="w-[22px] h-auto object-contain"
                                            />
                                        )}
                                    </button>
                                </div>

                                {/* Hairline Divider */}
                                <div className="border-t border-[#ececec] mb-2.5" />

                                {/* Account Transactions Link */}
                                <button
                                    onClick={() => setIsStatementOpen(true)}
                                    className="w-full flex items-center gap-2 text-[#005caa] hover:text-[#004885] active:translate-x-0.5 transition-all text-left pt-0.5"
                                >
                                    <img
                                        src="/clean-mode/icon_account_trans_hd.png"
                                        alt="Transactions"
                                        className="w-[21px] h-[19px] object-contain shrink-0"
                                    />
                                    <span
                                        className="text-[12.5px] font-bold"
                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif' }}
                                    >
                                        Account Transactions
                                    </span>
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
                                <h2
                                    className="text-[18px] font-bold text-[#0c3258] tracking-tight"
                                    style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                        color: '#0c3258',
                                    }}
                                >
                                    Main Menu
                                </h2>
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
                            className="cursor-pointer active:scale-[0.99] transition-transform rounded-2xl overflow-hidden shadow-sm mt-2 mb-1"
                        >
                            <img
                                src="/clean-mode/banner_aliens_exact.png"
                                alt="Pay 1 Get 2"
                                className="w-full object-contain rounded-2xl block"
                            />
                        </div>

                        {/* Carousel Indicator Dots below Banner 2 matching SS 1 */}
                        <div className="flex items-center justify-center gap-1.5 pt-0.5 pb-1">
                            <div className="w-[5px] h-[5px] rounded-full bg-[#cfd8dc]" />
                            <div className="w-[5px] h-[5px] rounded-full bg-[#cfd8dc]" />
                            <div className="w-[5.5px] h-[5.5px] rounded-full bg-[#00a2e8]" />
                            <div className="w-[5px] h-[5px] rounded-full bg-[#cfd8dc]" />
                            <div className="w-[5px] h-[5px] rounded-full bg-[#cfd8dc]" />
                        </div>

                        {/* ── SEKSI 1: POCKETS (Exact 1:1 Matching myBCA) ── */}
                        <div className="pt-0.5 pb-1">
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-2 px-1">
                                <h2
                                    className="text-[15px] font-bold text-[#0c3258] tracking-tight"
                                    style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                        color: '#0c3258',
                                    }}
                                >
                                    Pockets
                                </h2>
                            </div>

                            {/* Tabs (Rupiah Pocket / Forex Pocket) */}
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={() => setPocketTab('rupiah')}
                                    className={`px-3 py-1 rounded-[8px] text-[11.5px] h-[28px] transition-all cursor-pointer flex items-center justify-center ${
                                        pocketTab === 'rupiah'
                                            ? 'border-[1.5px] border-[#005caa] bg-[#e4f2fe] text-[#2d3748] font-medium shadow-xs'
                                            : 'border-[1.5px] border-[#cfcfcf] bg-white text-[#6e7479] font-normal hover:bg-slate-50'
                                    }`}
                                    style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                    }}
                                >
                                    Rupiah Pocket
                                </button>
                                <button
                                    onClick={() => setPocketTab('forex')}
                                    className={`px-3 py-1 rounded-[8px] text-[11.5px] h-[28px] transition-all cursor-pointer flex items-center justify-center ${
                                        pocketTab === 'forex'
                                            ? 'border-[1.5px] border-[#005caa] bg-[#e4f2fe] text-[#2d3748] font-medium shadow-xs'
                                            : 'border-[1.5px] border-[#cfcfcf] bg-white text-[#6e7479] font-normal hover:bg-slate-50'
                                    }`}
                                    style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                    }}
                                >
                                    Forex Pocket
                                </button>
                            </div>

                            {/* Pocket Info Card */}
                            <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-3.5 flex items-center gap-3">
                                {pocketTab === 'rupiah' ? (
                                    <>
                                        <img
                                            src="/clean-mode/pocket_illustration_exact.png"
                                            alt="Pocket"
                                            className="w-[38px] h-auto object-contain shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-[11px] leading-[15px] text-[#53575a] font-normal"
                                                style={{
                                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                                }}
                                            >
                                                Create a Rupiah Pocket to easily manage your finances according to your needs.
                                            </p>
                                            <button
                                                onClick={() => showToast('Buat Pocket Baru di myBCA')}
                                                className="text-[12px] font-bold text-[#005caa] hover:underline mt-1.5 inline-block text-left cursor-pointer active:scale-95 transition-transform"
                                                style={{
                                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                                }}
                                            >
                                                Create Now
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <img
                                            src="/clean-mode/pocket_illustration_exact.png"
                                            alt="Pocket"
                                            className="w-[38px] h-auto object-contain shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-[11px] leading-[15px] text-[#53575a] font-normal"
                                                style={{
                                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                                }}
                                            >
                                                Create a Forex Pocket for multi-currency transactions and competitive exchange rates.
                                            </p>
                                            <button
                                                onClick={() => showToast('Buat Forex Pocket di myBCA')}
                                                className="text-[12px] font-bold text-[#005caa] hover:underline mt-1.5 inline-block text-left cursor-pointer active:scale-95 transition-transform"
                                                style={{
                                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                                }}
                                            >
                                                Create Now
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── SEKSI 2: E-WALLET (Exact 1:1 Matching myBCA) ── */}
                        <div className="pt-0.5 pb-1">
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-2 px-1">
                                <h2
                                    className="text-[15px] font-bold text-[#0c3258] tracking-tight"
                                    style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                        color: '#0c3258',
                                    }}
                                >
                                    e-Wallet
                                </h2>
                            </div>

                            {/* e-Wallet Grid Cards (Exact 1:1 matching SS 2) */}
                            <div className="grid grid-cols-4 gap-2">
                                <div
                                    onClick={() => showToast('Sakuku BCA')}
                                    className="cursor-pointer active:scale-95 transition-transform rounded-[16px] overflow-hidden shadow-xs"
                                >
                                    <img
                                        src="/clean-mode/ewallet_card_sakuku_hd.png"
                                        alt="Sakuku"
                                        className="w-full h-auto object-contain block"
                                    />
                                </div>
                                <div
                                    onClick={() => showToast('DANA e-Wallet')}
                                    className="cursor-pointer active:scale-95 transition-transform rounded-[16px] overflow-hidden shadow-xs"
                                >
                                    <img
                                        src="/clean-mode/ewallet_card_dana_hd.png"
                                        alt="DANA"
                                        className="w-full h-auto object-contain block"
                                    />
                                </div>
                                <div
                                    onClick={() => showToast('GoPay e-Wallet')}
                                    className="cursor-pointer active:scale-95 transition-transform rounded-[16px] overflow-hidden shadow-xs"
                                >
                                    <img
                                        src="/clean-mode/ewallet_card_gopay_hd.png"
                                        alt="GoPay"
                                        className="w-full h-auto object-contain block"
                                    />
                                </div>
                                <div
                                    onClick={() => showToast('OVO e-Wallet')}
                                    className="cursor-pointer active:scale-95 transition-transform rounded-[16px] overflow-hidden shadow-xs"
                                >
                                    <img
                                        src="/clean-mode/ewallet_card_ovo_hd.png"
                                        alt="OVO"
                                        className="w-full h-auto object-contain block"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── SEKSI 3: CARD (Exact 1:1 Matching myBCA) ── */}
                        <div className="pt-0.5 pb-1">
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-2 px-1">
                                <h2
                                    className="text-[15px] font-bold text-[#0c3258] tracking-tight"
                                    style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                        color: '#0c3258',
                                    }}
                                >
                                    Card
                                </h2>
                            </div>

                            {/* Tabs (Debit Card / Credit Card) */}
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={() => setCardTab('debit')}
                                    className={`px-3 py-1 rounded-[8px] text-[11.5px] h-[28px] transition-all cursor-pointer flex items-center justify-center ${
                                        cardTab === 'debit'
                                            ? 'border-[1.5px] border-[#005caa] bg-[#e4f2fe] text-[#2d3748] font-medium shadow-xs'
                                            : 'border-[1.5px] border-[#cfcfcf] bg-white text-[#6e7479] font-normal hover:bg-slate-50'
                                    }`}
                                    style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                    }}
                                >
                                    Debit Card
                                </button>
                                <button
                                    onClick={() => setCardTab('credit')}
                                    className={`px-3 py-1 rounded-[8px] text-[11.5px] h-[28px] transition-all cursor-pointer flex items-center justify-center ${
                                        cardTab === 'credit'
                                            ? 'border-[1.5px] border-[#005caa] bg-[#e4f2fe] text-[#2d3748] font-medium shadow-xs'
                                            : 'border-[1.5px] border-[#cfcfcf] bg-white text-[#6e7479] font-normal hover:bg-slate-50'
                                    }`}
                                    style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                    }}
                                >
                                    Credit Card
                                </button>
                            </div>

                            {/* Card Item Container */}
                            <div className="bg-white rounded-[18px] border border-[#eef2f6] shadow-[0_2px_10px_rgba(0,0,0,0.03)] px-3.5 py-3 flex items-center justify-between">
                                {cardTab === 'debit' ? (
                                    <>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src="/clean-mode/card_paspor_platinum_thumb_exact.png"
                                                alt="Paspor BCA Platinum"
                                                className="w-[42px] h-[27px] object-contain rounded-[3px] shadow-xs shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p
                                                    className="text-[12.5px] font-semibold text-[#1e293b] tracking-normal whitespace-nowrap"
                                                    style={{
                                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                                    }}
                                                >
                                                    5260 - **** - **** - **60
                                                </p>
                                                <p
                                                    className="text-[10px] font-medium text-[#64748b] tracking-wide mt-0.5 whitespace-nowrap"
                                                    style={{
                                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                                    }}
                                                >
                                                    PASPOR BCA PLATINUM
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => showToast('Pengaturan Kartu Debit')}
                                            className="flex items-center gap-1 text-[#005caa] hover:text-[#004885] active:scale-95 transition-transform cursor-pointer shrink-0 ml-2"
                                            style={{
                                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                            }}
                                        >
                                            <Settings className="w-3.5 h-3.5 stroke-[2.4]" />
                                            <span className="text-[12px] font-bold">Manage</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-[42px] h-[27px] rounded-[3px] bg-gradient-to-tr from-[#1a365d] to-[#2b6cb0] flex items-center justify-center shadow-xs shrink-0">
                                                <span className="text-[8px] font-bold text-white tracking-widest">BCA</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p
                                                    className="text-[12.5px] font-semibold text-[#1e293b] tracking-normal whitespace-nowrap"
                                                    style={{
                                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                                    }}
                                                >
                                                    BCA Everyday Card
                                                </p>
                                                <p
                                                    className="text-[10px] font-medium text-[#64748b] tracking-wide mt-0.5 whitespace-nowrap"
                                                    style={{
                                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                                    }}
                                                >
                                                    5412 - **** - **** - **88
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => showToast('Pengaturan Kartu Kredit')}
                                            className="flex items-center gap-1 text-[#005caa] hover:text-[#004885] active:scale-95 transition-transform cursor-pointer shrink-0 ml-2"
                                            style={{
                                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                            }}
                                        >
                                            <Settings className="w-3.5 h-3.5 stroke-[2.4]" />
                                            <span className="text-[12px] font-bold">Manage</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── 4. FINANCIAL DIARY SECTION (Exact 1:1 Matching myBCA) ── */}
                        <div className="pt-1 pb-1">
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-2.5 px-1">
                                <h2
                                    className="text-[18px] font-bold text-[#0c3258] tracking-tight"
                                    style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                        color: '#0c3258',
                                    }}
                                >
                                    Financial Diary
                                </h2>
                                <span
                                    className="text-[15px] font-medium"
                                    style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                        color: '#718096',
                                    }}
                                >
                                    Cashflow
                                </span>
                            </div>

                            {/* White Financial Diary Card */}
                            <div className="bg-white rounded-[22px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 relative">
                                {/* Month Selector Capsule */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                                        className="w-full flex items-center justify-between px-3.5 py-2 rounded-[9px] border border-[#dce3ec] bg-white text-[13.5px] font-medium hover:border-[#005caa] transition-colors cursor-pointer"
                                        style={{
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                            color: '#2c3e50',
                                        }}
                                        aria-label="Pilih Periode"
                                    >
                                        <span>{selectedMonth}</span>
                                        <svg
                                            className={`w-4 h-4 stroke-[#005caa] stroke-[2.5] fill-none transition-transform duration-200 ${
                                                isMonthPickerOpen ? 'rotate-180' : ''
                                            }`}
                                            viewBox="0 0 24 24"
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>

                                    {/* Month Dropdown List */}
                                    {isMonthPickerOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d8e2ed] rounded-lg shadow-lg z-30 py-1 overflow-hidden">
                                            {availableMonths.map((m) => (
                                                <button
                                                    key={m}
                                                    onClick={() => {
                                                        setSelectedMonth(m);
                                                        setIsMonthPickerOpen(false);
                                                        showToast(`Periode diubah ke ${m}`);
                                                    }}
                                                    className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-[#f0f6fc] transition-colors ${
                                                        selectedMonth === m
                                                            ? 'text-[#005caa] font-bold bg-[#f0f6fc]'
                                                            : 'text-[#2c3e50]'
                                                    }`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Donut Ring & Center Details */}
                                {fdSlide === 0 ? (
                                    <SpendingDonutChart
                                        categories={spendingCategories}
                                        selectedCategoryId={selectedCategoryId}
                                        onSelectCategory={setSelectedCategoryId}
                                        isMasked={fdMasked}
                                        onToggleMask={handleToggleFdMask}
                                    />
                                ) : (
                                    <div className="relative w-[220px] h-[220px] mx-auto flex items-center justify-center my-3.5">
                                        <img
                                            src={fdSlides[fdSlide].ringImg}
                                            alt={fdSlides[fdSlide].title}
                                            className="w-full h-full object-contain pointer-events-none select-none"
                                        />
                                        <div
                                            className="absolute inset-0 flex flex-col items-center justify-center text-center select-none"
                                            style={{
                                                fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                                                    fontSize: '15px',
                                                    fontWeight: 600,
                                                    color: '#495057',
                                                    lineHeight: '1.2',
                                                    letterSpacing: '-0.01em',
                                                    display: 'block',
                                                }}
                                            >
                                                Total
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                                                    fontSize: '15px',
                                                    fontWeight: 600,
                                                    color: '#495057',
                                                    lineHeight: '1.2',
                                                    letterSpacing: '-0.01em',
                                                    display: 'block',
                                                    marginTop: '2px',
                                                }}
                                            >
                                                {fdSlides[fdSlide].label}
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                                                    fontSize: '16.5px',
                                                    fontWeight: 700,
                                                    color: '#144e83',
                                                    lineHeight: '1.2',
                                                    letterSpacing: '-0.01em',
                                                    display: 'block',
                                                    marginTop: '6px',
                                                }}
                                            >
                                                {fdMasked ? 'IDR ******' : fdSlides[fdSlide].amount}
                                            </span>
                                            <button
                                                onClick={handleToggleFdMask}
                                                className="mt-2.5 w-[42px] h-[30px] rounded-[6px] border border-[#dce3ea] bg-[#f3f6f9] hover:bg-[#ebf0f5] active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                                                title={fdMasked ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
                                                aria-label="Toggle nominal visibility"
                                            >
                                                {fdMasked ? (
                                                    <svg className="w-[18px] h-[18px] stroke-[#7c8a9c] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-[18px] h-[18px] stroke-[#7c8a9c] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Carousel Navigation Controls */}
                                <div className="flex items-center justify-between px-6 mt-1 mb-2">
                                    {/* Previous Button */}
                                    <button
                                        onClick={() => setFdSlide(Math.max(0, fdSlide - 1))}
                                        disabled={fdSlide === 0}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                            fdSlide === 0
                                                ? 'bg-transparent text-[#d5dde6] cursor-default'
                                                : 'bg-[#ebf4fd] text-[#005caa] hover:bg-[#deeeff] active:scale-90 cursor-pointer shadow-xs'
                                        }`}
                                        aria-label="Previous slide"
                                    >
                                        <svg className="w-4 h-4 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                    </button>

                                    {/* 3 Pagination Dots */}
                                    <div className="flex items-center gap-2">
                                        {fdSlides.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setFdSlide(idx)}
                                                className={`transition-all duration-300 rounded-full cursor-pointer ${
                                                    fdSlide === idx
                                                        ? 'w-[6.5px] h-[6.5px] bg-[#0c3258]'
                                                        : 'w-[6.5px] h-[6.5px] bg-[#dbe2ea] hover:bg-slate-400'
                                                }`}
                                                aria-label={`Slide ${idx + 1}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        onClick={() => setFdSlide(Math.min(fdSlides.length - 1, fdSlide + 1))}
                                        disabled={fdSlide === fdSlides.length - 1}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                            fdSlide === fdSlides.length - 1
                                                ? 'bg-transparent text-[#d5dde6] cursor-default'
                                                : 'bg-[#ebf4fd] text-[#005caa] hover:bg-[#deeeff] active:scale-90 cursor-pointer shadow-xs'
                                        }`}
                                        aria-label="Next slide"
                                    >
                                        <svg className="w-4 h-4 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                </div>

                                {/* View Cashflow Details Link */}
                                <div className="pt-3 pb-1 text-center">
                                    <button
                                        onClick={() => {
                                            setActiveTab('activity');
                                            setIsStatementOpen(true);
                                        }}
                                        className="text-[14px] font-bold text-[#005caa] hover:text-[#004885] active:scale-98 transition-all hover:underline cursor-pointer"
                                        style={{
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Plus Jakarta Sans", sans-serif',
                                        }}
                                    >
                                        View Cashflow Details
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── 5. CURRENCY EXCHANGE RATES SECTION (Exact 1:1 Matching myBCA) ── */}
                        <div className="pt-1 pb-6">
                            {/* Header */}
                            <div
                                onClick={() => showToast('Informasi Kurs BCA Terbaru')}
                                className="flex items-center justify-between mb-3 px-1 cursor-pointer group"
                            >
                                <h2 className="text-[16.5px] font-extrabold text-[#0c3258] tracking-tight">Currency Exchange Rates</h2>
                                <svg className="w-4 h-4 text-[#0c3258] stroke-current stroke-[2.5] fill-none group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </div>

                            {/* Rates Table Card */}
                            <div className="bg-white rounded-[22px] border border-[#eef2f6] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4">
                                {/* Table Header */}
                                <div className="flex items-center justify-between text-[12.5px] font-bold text-[#0c3258] pb-3 border-b border-slate-100 px-1">
                                    <span className="w-1/3">Currency</span>
                                    <span className="w-1/3 text-center">Bank Buy</span>
                                    <span className="w-1/3 text-right">Bank Sell</span>
                                </div>

                                {/* Currency Rows */}
                                <div className="divide-y divide-slate-50 pt-1">
                                    {/* USD Row */}
                                    <div className="flex items-center justify-between py-2.5 px-1">
                                        <div className="w-1/3 flex items-center gap-2">
                                            <svg className="w-5 h-5 rounded-full shrink-0 shadow-xs overflow-hidden" viewBox="0 0 64 64">
                                                <rect width="64" height="64" fill="#b22234" />
                                                <rect y="5" width="64" height="5" fill="#ffffff" />
                                                <rect y="15" width="64" height="5" fill="#ffffff" />
                                                <rect y="25" width="64" height="5" fill="#ffffff" />
                                                <rect y="35" width="64" height="5" fill="#ffffff" />
                                                <rect y="45" width="64" height="5" fill="#ffffff" />
                                                <rect y="55" width="64" height="5" fill="#ffffff" />
                                                <rect width="32" height="35" fill="#3c3b6e" />
                                                <circle cx="8" cy="7" r="1.8" fill="#ffffff" />
                                                <circle cx="16" cy="7" r="1.8" fill="#ffffff" />
                                                <circle cx="24" cy="7" r="1.8" fill="#ffffff" />
                                                <circle cx="12" cy="14" r="1.8" fill="#ffffff" />
                                                <circle cx="20" cy="14" r="1.8" fill="#ffffff" />
                                                <circle cx="8" cy="21" r="1.8" fill="#ffffff" />
                                                <circle cx="16" cy="21" r="1.8" fill="#ffffff" />
                                                <circle cx="24" cy="21" r="1.8" fill="#ffffff" />
                                                <circle cx="12" cy="28" r="1.8" fill="#ffffff" />
                                                <circle cx="20" cy="28" r="1.8" fill="#ffffff" />
                                            </svg>
                                            <span className="text-[13.5px] font-bold text-[#0c3258]">USD</span>
                                        </div>
                                        <span className="w-1/3 text-center text-[13.5px] font-medium text-[#4a4f56]">17,540.00</span>
                                        <span className="w-1/3 text-right text-[13.5px] font-medium text-[#4a4f56]">17,690.00</span>
                                    </div>

                                    {/* SGD Row */}
                                    <div className="flex items-center justify-between py-2.5 px-1">
                                        <div className="w-1/3 flex items-center gap-2">
                                            <svg className="w-5 h-5 rounded-full shrink-0 shadow-xs overflow-hidden" viewBox="0 0 64 64">
                                                <rect width="64" height="32" fill="#ed2939" />
                                                <rect y="32" width="64" height="32" fill="#ffffff" />
                                                <circle cx="16" cy="16" r="8" fill="#ffffff" />
                                                <circle cx="19" cy="16" r="7" fill="#ed2939" />
                                            </svg>
                                            <span className="text-[13.5px] font-bold text-[#0c3258]">SGD</span>
                                        </div>
                                        <span className="w-1/3 text-center text-[13.5px] font-medium text-[#4a4f56]">13,420.00</span>
                                        <span className="w-1/3 text-right text-[13.5px] font-medium text-[#4a4f56]">13,580.00</span>
                                    </div>

                                    {/* EUR Row */}
                                    <div className="flex items-center justify-between py-2.5 px-1">
                                        <div className="w-1/3 flex items-center gap-2">
                                            <svg className="w-5 h-5 rounded-full shrink-0 shadow-xs overflow-hidden" viewBox="0 0 64 64">
                                                <rect width="64" height="64" fill="#003399" />
                                                <circle cx="32" cy="14" r="2.2" fill="#ffcc00" />
                                                <circle cx="32" cy="50" r="2.2" fill="#ffcc00" />
                                                <circle cx="14" cy="32" r="2.2" fill="#ffcc00" />
                                                <circle cx="50" cy="32" r="2.2" fill="#ffcc00" />
                                                <circle cx="19" cy="19" r="2.2" fill="#ffcc00" />
                                                <circle cx="45" cy="19" r="2.2" fill="#ffcc00" />
                                                <circle cx="19" cy="45" r="2.2" fill="#ffcc00" />
                                                <circle cx="45" cy="45" r="2.2" fill="#ffcc00" />
                                            </svg>
                                            <span className="text-[13.5px] font-bold text-[#0c3258]">EUR</span>
                                        </div>
                                        <span className="w-1/3 text-center text-[13.5px] font-medium text-[#4a4f56]">19,110.00</span>
                                        <span className="w-1/3 text-right text-[13.5px] font-medium text-[#4a4f56]">19,340.00</span>
                                    </div>
                                </div>
                            </div>
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
                                className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 cleanmode-no-scrollbar"
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

                                    {/* Financial Diary Customization */}
                                    <div className="pt-2.5 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-slate-800 text-[12.5px]">Financial Diary</span>
                                                <span className="text-[10px] text-slate-400 font-medium">(Diagram & Nominal)</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-[#005caa]">
                                                Total: {formatFdAmount(customCategories.reduce((s, c) => s + (Number(c.amount) || 0), 0))}
                                            </span>
                                        </div>

                                        {/* Spending Categories List */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-bold text-slate-700">Kategori Total Spending</span>
                                                <span className="text-[10px] text-slate-400">{customCategories.length} Kategori</span>
                                            </div>

                                            <div className="space-y-2 max-h-[190px] overflow-y-auto cleanmode-no-scrollbar pr-0.5">
                                                {customCategories.map((cat, idx) => {
                                                    const curTotal = customCategories.reduce((s, c) => s + (Number(c.amount) || 0), 0);
                                                    const pct = curTotal > 0 ? Math.round((cat.amount / curTotal) * 100) : 0;
                                                    return (
                                                        <div
                                                            key={cat.id}
                                                            className="bg-white border border-slate-200/80 rounded-xl p-2 flex flex-col gap-1.5 shadow-2xs"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {/* Color Selector Dot */}
                                                                <button
                                                                    type="button"
                                                                    title="Klik untuk ganti warna"
                                                                    onClick={() => {
                                                                        const nextIdx = (CATEGORY_COLORS.indexOf(cat.color) + 1) % CATEGORY_COLORS.length;
                                                                        const updated = [...customCategories];
                                                                        updated[idx] = { ...updated[idx], color: CATEGORY_COLORS[nextIdx] };
                                                                        setCustomCategories(updated);
                                                                    }}
                                                                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center border border-black/10 shadow-xs cursor-pointer transition-transform hover:scale-110 active:scale-90"
                                                                    style={{ backgroundColor: cat.color }}
                                                                >
                                                                    <span className="text-[9px] text-white font-bold opacity-80">●</span>
                                                                </button>

                                                                {/* Category Name Input */}
                                                                <input
                                                                    type="text"
                                                                    value={cat.name}
                                                                    onChange={(e) => {
                                                                        const updated = [...customCategories];
                                                                        updated[idx] = { ...updated[idx], name: e.target.value };
                                                                        setCustomCategories(updated);
                                                                    }}
                                                                    placeholder="Nama Kategori"
                                                                    className="flex-1 min-w-0 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-[11px] focus:outline-none focus:ring-1 focus:ring-[#005caa]"
                                                                />

                                                                {/* Delete Button (if > 1) */}
                                                                {customCategories.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setCustomCategories(customCategories.filter((_, i) => i !== idx));
                                                                        }}
                                                                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                                                                        title="Hapus Kategori"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Amount & Percentage Row */}
                                                            <div className="flex items-center gap-2 pl-7">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                                                                        Rp
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        value={cat.amount}
                                                                        onChange={(e) => {
                                                                            const val = Math.max(0, Number(e.target.value) || 0);
                                                                            const updated = [...customCategories];
                                                                            updated[idx] = { ...updated[idx], amount: val };
                                                                            setCustomCategories(updated);
                                                                        }}
                                                                        placeholder="0"
                                                                        className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold text-[11px] focus:outline-none focus:ring-1 focus:ring-[#005caa]"
                                                                    />
                                                                </div>
                                                                <div className="shrink-0 px-2 py-0.5 rounded-md bg-blue-50 text-[#005caa] font-bold text-[10.5px]">
                                                                    {pct}% ({formatFdAmount(cat.amount)})
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Category Action Buttons */}
                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60">
                                                <button
                                                    type="button"
                                                    onClick={handleAddCategory}
                                                    className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                                >
                                                    <Plus className="w-3.5 h-3.5 text-[#005caa]" />
                                                    <span>Tambah Kategori</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomCategories(JSON.parse(JSON.stringify(DEFAULT_SPENDING_CATEGORIES)));
                                                    }}
                                                    className="py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                                    title="Kembalikan ke 4 Kategori myBCA Asli"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    <span>Reset myBCA</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div>
                                                <label className="block text-slate-500 font-medium mb-1 text-[11px]">Total Earning (Slide 2)</label>
                                                <input
                                                    type="text"
                                                    value={customEarningInput}
                                                    placeholder="IDR 1 M"
                                                    onChange={e => setCustomEarningInput(e.target.value)}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#005caa]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-slate-500 font-medium mb-1 text-[11px]">Total Cashflow (Slide 3)</label>
                                                <input
                                                    type="text"
                                                    value={customCashflowInput}
                                                    placeholder="IDR 221,73 K"
                                                    onChange={e => setCustomCashflowInput(e.target.value)}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#005caa]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Storage Persistence Indicator */}
                                    <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-2 text-[11px] text-blue-900 font-medium">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span>Data disimpan permanen di perangkat & tetap tersimpan saat aplikasi ditutup.</span>
                                    </div>

                                    <div className="pt-2 flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCustomNameInput('AHMAD FIKRI RAFI UDDIN');
                                                setCustomAccountInput('801 - 040 - 1811');
                                                setCustomBalanceInput('529265.71');
                                                setCustomCategories(JSON.parse(JSON.stringify(DEFAULT_SPENDING_CATEGORIES)));
                                                setCustomEarningInput('IDR 1 M');
                                                setCustomCashflowInput('IDR 221,73 K');
                                            }}
                                            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#005caa] rounded-xl font-semibold text-xs transition-colors border border-blue-200 text-center cursor-pointer"
                                        >
                                            Salin Nilai Contoh Acuan (myBCA)
                                        </button>

                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const user = authService.getCurrentUser();
                                                if (user?.name) setCustomNameInput(user.name.toUpperCase());
                                                try {
                                                    const stats = await dashboardService.getStats();
                                                    if (stats && typeof stats.totalBalance === 'number') {
                                                        setCustomBalanceInput(String(stats.totalBalance));
                                                    }
                                                } catch (e) {
                                                    console.warn(e);
                                                }
                                            }}
                                            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs transition-colors border border-slate-200 text-center cursor-pointer"
                                        >
                                            Isi Otomatis Data Profil Rupiku Asli
                                        </button>

                                        <button
                                            onClick={handleSaveCustomSettings}
                                            className="w-full py-2.5 bg-[#005caa] text-white rounded-xl font-bold text-xs hover:bg-[#004b9c] transition-colors shadow-md shadow-blue-900/20 cursor-pointer"
                                        >
                                            Simpan Perubahan
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsSettingsOpen(false);
                                                navigate('/dashboard');
                                            }}
                                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
