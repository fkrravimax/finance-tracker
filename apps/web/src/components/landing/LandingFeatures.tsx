import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LandingFeaturesProps {
    isActive: boolean;
    onSignUp: () => void;
}

const LandingFeatures: React.FC<LandingFeaturesProps> = ({ isActive, onSignUp }) => {
    const { t } = useLanguage();
    const [activeFeature, setActiveFeature] = useState(0);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [modalFeature, setModalFeature] = useState(0);

    const features = [
        {
            icon: 'dashboard',
            label: t('landing.features.dashboard'),
            desc: t('landing.features.dashboardDesc'),
            preview: '/previews/dashboard.jpg'
        },
        {
            icon: 'savings',
            label: t('landing.features.savings'),
            desc: t('landing.features.savingsDesc'),
            preview: '/previews/savings.jpg'
        },
        {
            icon: 'trending_up',
            label: t('landing.features.trading'),
            desc: t('landing.features.tradingDesc'),
            preview: '/previews/trading.jpg'
        },
        {
            icon: 'receipt_long',
            label: t('landing.features.transactions'),
            desc: t('landing.features.transactionsDesc'),
            preview: '/previews/transactions.jpg'
        },
    ];

    // Auto-rotate features
    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isActive, features.length]);

    const handleMobileFeatureClick = (index: number) => {
        setModalFeature(index);
        setShowFeatureModal(true);
    };

    return (
        <>
            <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out`}
                style={{
                    transform: isActive ? 'translateX(0)' : 'translateX(100%)', // Simplified logic, actual direction depends on nav
                    opacity: isActive ? 1 : 0,
                    pointerEvents: isActive ? 'auto' : 'none'
                }}
            >
                {/* Desktop: Split Layout */}
                <div className="hidden md:flex items-center gap-8 lg:gap-12 w-full max-w-4xl">
                    {/* Left - Feature Icons */}
                    <div className="flex flex-col gap-3">
                        {features.map((f, idx) => (
                            <button
                                key={f.label}
                                onClick={() => setActiveFeature(idx)}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${activeFeature === idx
                                    ? 'bg-primary/10 dark:bg-primary/20 border-primary'
                                    : 'bg-white dark:bg-[#2b2616] border-slate-200 dark:border-[#493f22] hover:border-primary/50'
                                    }`}
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${activeFeature === idx ? 'bg-primary' : 'bg-primary/10 dark:bg-primary/20'
                                    }`}>
                                    <span className={`material-symbols-outlined text-xl ${activeFeature === idx ? 'text-slate-900' : 'text-primary'
                                        }`}>{f.icon}</span>
                                </div>
                                <span className={`font-bold ${activeFeature === idx ? 'text-primary' : 'text-slate-700 dark:text-white'
                                    }`}>{f.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right - Preview (Image Only) */}
                    <div className="flex-1 relative">
                        <div className="bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-2xl p-3 overflow-hidden">
                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-[#1a160b] relative">
                                {features.map((f, idx) => (
                                    <img
                                        key={f.label}
                                        src={f.preview}
                                        alt={f.label}
                                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${activeFeature === idx ? 'opacity-100' : 'opacity-0'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile: Grid with Click to Modal */}
                <div className="flex md:hidden">
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                        {features.map((f, idx) => (
                            <button
                                key={f.label}
                                onClick={() => handleMobileFeatureClick(idx)}
                                className="bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary transition-all active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl text-primary">{f.icon}</span>
                                </div>
                                <span className="font-bold text-sm text-slate-700 dark:text-white">{f.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Feature Modal */}
            {showFeatureModal && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:hidden"
                    onClick={() => setShowFeatureModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#2b2616] rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#493f22]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl text-slate-900">
                                        {features[modalFeature].icon}
                                    </span>
                                </div>
                                <span className="font-bold text-lg text-slate-900 dark:text-white">
                                    {features[modalFeature].label}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowFeatureModal(false)}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1a160b] transition-all"
                            >
                                <span className="material-symbols-outlined text-slate-500">close</span>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4">
                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-[#1a160b] mb-4">
                                <img
                                    src={features[modalFeature].preview}
                                    alt={features[modalFeature].label}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-[#cbbc90]">
                                {features[modalFeature].desc}
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-[#493f22]">
                            <button
                                onClick={() => { setShowFeatureModal(false); onSignUp(); }}
                                className="w-full bg-primary hover:bg-primary-hover text-slate-900 font-bold py-3 rounded-xl transition-all"
                            >
                                Try {features[modalFeature].label}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LandingFeatures;
