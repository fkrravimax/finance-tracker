import React, { useState, useEffect } from 'react';
import { useAppearance } from '../contexts/AppearanceContext';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingPageProps {
    onSignUp: () => void;
    onSignIn: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignUp, onSignIn }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeFeature, setActiveFeature] = useState(0);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [modalFeature, setModalFeature] = useState(0);
    const { theme, setTheme } = useAppearance();
    const { language, setLanguage, t } = useLanguage();
    const totalSlides = 3;

    // Auto-rotate slides every 60 seconds (1 minute)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Auto-rotate features every 4 seconds when on slide 0
    useEffect(() => {
        if (currentSlide !== 0) return;
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [currentSlide]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    const goToSlide = (index: number) => setCurrentSlide(index);

    // Features data
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

    // Steps data for Slide 3
    const steps = [
        { num: 1, icon: 'person_add', title: t('landing.howItWorks.step1Title'), desc: t('landing.howItWorks.step1Desc') },
        { num: 2, icon: 'monitoring', title: t('landing.howItWorks.step2Title'), desc: t('landing.howItWorks.step2Desc') },
        { num: 3, icon: 'trending_up', title: t('landing.howItWorks.step3Title'), desc: t('landing.howItWorks.step3Desc') },
    ];

    // Handle mobile feature click
    const handleMobileFeatureClick = (index: number) => {
        setModalFeature(index);
        setShowFeatureModal(true);
    };

    return (
        <div className="h-screen w-full flex flex-col bg-background-light dark:bg-background-dark font-display overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-4 md:px-12 lg:px-20 py-4 md:py-6 shrink-0 border-b border-transparent md:border-slate-200/10">
                <div className="flex items-center gap-2 md:gap-3">
                    <img src="/logo.png" alt="Rupiku" className="w-8 h-8 md:w-10 md:h-10" />
                    <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">Rupiku</span>
                </div>

                <nav className="hidden md:flex items-center gap-8">
                    <button
                        onClick={() => goToSlide(2)}
                        className="text-slate-500 dark:text-[#cbbc90] hover:text-primary transition-all font-medium"
                    >
                        {t('common.next')}
                    </button>
                </nav>

                <div className="flex items-center gap-2 md:gap-4">
                    <span className="hidden md:inline text-slate-500 dark:text-[#cbbc90] hover:text-primary cursor-pointer transition-all font-medium">
                        Help Center
                    </span>
                    {/* Language Toggle */}
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-full text-slate-500 dark:text-[#cbbc90] hover:text-primary hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all text-sm font-bold"
                        title={language === 'en' ? 'Switch to Indonesian' : 'Switch to English'}
                    >
                        <span className="material-symbols-outlined text-lg">language</span>
                        <span className="uppercase">{language}</span>
                    </button>
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all"
                        title="Toggle Theme"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 relative min-h-0">
                {/* Navigation Arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute left-2 md:left-6 lg:left-12 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full border border-slate-300 dark:border-[#493f22] flex items-center justify-center text-slate-500 dark:text-[#cbbc90] hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all z-10"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>

                <div className="w-full max-w-5xl h-[480px] md:h-[420px] lg:h-[480px] relative overflow-hidden">
                    {/* ===== SLIDE 1 - FEATURES (Interactive) ===== */}
                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${currentSlide === 0
                            ? 'opacity-100 translate-x-0'
                            : currentSlide > 0
                                ? 'opacity-0 -translate-x-full'
                                : 'opacity-0 translate-x-full'
                            }`}
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

                    {/* ===== SLIDE 2 - HERO ===== */}
                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${currentSlide === 1
                            ? 'opacity-100 translate-x-0'
                            : currentSlide > 1
                                ? 'opacity-0 -translate-x-full'
                                : 'opacity-0 translate-x-full'
                            }`}
                    >
                        <div className="flex flex-col items-center text-center px-4">
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 md:mb-6">
                                {t('landing.hero.title')} <span className="text-primary">{t('landing.hero.titleHighlight')}</span>
                            </h1>
                            <p className="text-base md:text-xl text-slate-500 dark:text-[#cbbc90] max-w-xl">
                                {t('landing.hero.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* ===== SLIDE 3 - HOW IT WORKS ===== */}
                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${currentSlide === 2
                            ? 'opacity-100 translate-x-0'
                            : currentSlide < 2
                                ? 'opacity-0 translate-x-full'
                                : 'opacity-0 -translate-x-full'
                            }`}
                    >
                        <div className="flex flex-col items-center w-full px-2 h-full justify-center">
                            <div className="inline-block px-3 py-1 bg-primary/10 dark:bg-primary/20 rounded-full mb-2 md:mb-4">
                                <span className="text-[9px] md:text-xs font-bold text-primary uppercase tracking-wider">The Roadmap</span>
                            </div>
                            <h2 className="text-lg md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white text-center mb-1 md:mb-3">
                                {t('landing.howItWorks.title')}
                            </h2>
                            <p className="text-[10px] md:text-base text-slate-500 dark:text-[#cbbc90] text-center mb-3 md:mb-10 max-w-lg hidden md:block">
                                {t('landing.howItWorks.title')}
                            </p>

                            {/* Mobile: Horizontal compact cards */}
                            <div className="flex md:hidden gap-2 w-full max-w-sm justify-center">
                                {steps.map((step) => (
                                    <div key={step.num} className="flex flex-col items-center flex-1">
                                        <div className="w-6 h-6 rounded-full bg-primary text-slate-900 text-xs font-bold flex items-center justify-center mb-2">
                                            {step.num}
                                        </div>
                                        <div className="bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-lg p-2 text-center w-full">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-1">
                                                <span className="material-symbols-outlined text-sm text-primary">{step.icon}</span>
                                            </div>
                                            <h3 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5">{step.title}</h3>
                                            <p className="text-[9px] text-slate-500 dark:text-[#cbbc90] leading-tight">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop: Original layout */}
                            <div className="hidden md:flex gap-6 lg:gap-8 w-full max-w-4xl justify-center items-stretch">
                                {steps.map((step, idx) => (
                                    <div key={step.num} className="flex flex-col items-center flex-1 relative">
                                        <div className="w-10 h-10 rounded-full bg-primary text-slate-900 text-base font-bold flex items-center justify-center mb-4 z-10">
                                            {step.num}
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div className="absolute top-5 left-[calc(50%+24px)] w-[calc(100%-48px)] h-[2px] bg-[#493f22]" />
                                        )}
                                        <div className="bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 text-center w-full h-full">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined text-2xl text-primary">{step.icon}</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{step.title}</h3>
                                            <p className="text-sm text-slate-500 dark:text-[#cbbc90] leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={nextSlide}
                    className="absolute right-2 md:right-6 lg:right-12 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full border border-slate-300 dark:border-[#493f22] flex items-center justify-center text-slate-500 dark:text-[#cbbc90] hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all z-10"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>

                {/* Dot Indicators */}
                <div className="flex items-center gap-2 mt-4 md:mt-8">
                    {[0, 1, 2].map((i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i)}
                            className={`transition-all ${currentSlide === i
                                ? 'w-8 h-2.5 bg-primary rounded-full'
                                : 'w-2.5 h-2.5 bg-slate-300 dark:bg-[#493f22] rounded-full hover:bg-primary/50'
                                }`}
                        />
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="px-4 md:px-12 lg:px-20 py-4 md:py-6 shrink-0">
                <div className="flex flex-col items-center gap-2 md:hidden">
                    <button
                        onClick={onSignUp}
                        className="w-full max-w-sm bg-primary hover:bg-primary-hover text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                    >
                        {t('landing.hero.getStarted')}
                    </button>
                    <button
                        onClick={onSignIn}
                        className="w-full max-w-sm bg-transparent border-2 border-primary text-primary font-bold py-3 rounded-xl transition-all hover:bg-primary/10 active:scale-[0.98]"
                    >
                        {t('landing.hero.signIn')}
                    </button>
                    <span className="text-xs text-slate-400 dark:text-[#cbbc90]/60 hover:text-primary cursor-pointer transition-all">
                        View Live Demo
                    </span>
                </div>

                <div className="hidden md:flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onSignIn}
                            className="text-slate-500 dark:text-[#cbbc90] hover:text-primary font-medium transition-all"
                        >
                            {t('landing.hero.signIn')}
                        </button>
                        <button className="px-6 py-3 rounded-xl border border-slate-300 dark:border-[#493f22] text-slate-700 dark:text-white font-bold hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all">
                            Live Demo
                        </button>
                    </div>
                    <button
                        onClick={onSignUp}
                        className="px-8 py-3 bg-primary hover:bg-primary-hover text-slate-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/25 active:scale-[0.98] flex items-center gap-2"
                    >
                        {t('landing.hero.getStarted')}
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>
            </footer>

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
        </div>
    );
};

export default LandingPage;
