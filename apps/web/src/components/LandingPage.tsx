import React, { useState, useEffect } from 'react';
import { useAppearance } from '../contexts/AppearanceContext';

interface LandingPageProps {
    onSignUp: () => void;
    onSignIn: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignUp, onSignIn }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { theme, setTheme } = useAppearance();
    const totalSlides = 3;

    // Auto-rotate slides every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    const goToSlide = (index: number) => setCurrentSlide(index);

    // Features data for Slide 1
    const features = [
        { icon: 'dashboard', label: 'Dashboard' },
        { icon: 'savings', label: 'Savings' },
        { icon: 'trending_up', label: 'Trading' },
        { icon: 'receipt_long', label: 'Transactions' },
    ];

    // Steps data for Slide 3
    const steps = [
        { num: 1, icon: 'person_add', title: 'Create', desc: 'Set up your profile and securely link your accounts' },
        { num: 2, icon: 'monitoring', title: 'Track', desc: 'Monitor spending, net worth, and investments in one view' },
        { num: 3, icon: 'trending_up', title: 'Grow', desc: 'Optimize your portfolio with insights and tools' },
    ];

    return (
        <div className="h-screen w-full flex flex-col bg-background-light dark:bg-background-dark font-display overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="FinTrack" className="w-10 h-10" />
                    <span className="text-xl font-black text-slate-900 dark:text-white">FinTrack</span>
                </div>
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all"
                    title="Toggle Theme"
                >
                    <span className="material-symbols-outlined text-xl">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
            </header>

            {/* Main Content - Carousel */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
                {/* Left Arrow */}
                <button
                    onClick={prevSlide}
                    className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-slate-300 dark:border-[#493f22] flex items-center justify-center text-slate-500 dark:text-[#cbbc90] hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {/* Slides Container */}
                <div className="w-full max-w-2xl">
                    {/* Slide 1 - Features */}
                    <div className={`transition-all duration-500 ${currentSlide === 0 ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                        <div className="flex flex-col items-center">
                            <div className="grid grid-cols-2 gap-4 max-w-md">
                                {features.map((f) => (
                                    <div
                                        key={f.label}
                                        className="bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-primary transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-2xl text-primary">{f.icon}</span>
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-white">{f.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Slide 2 - Hero/Welcome */}
                    <div className={`transition-all duration-500 ${currentSlide === 1 ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                        <div className="flex flex-col items-center text-center px-4">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                                Your money, <span className="text-primary">your way.</span>
                            </h1>
                            <p className="text-lg text-slate-500 dark:text-[#cbbc90] max-w-md">
                                Track expenses, grow savings, and invest smarter — all in one beautiful app.
                            </p>
                        </div>
                    </div>

                    {/* Slide 3 - How It Works */}
                    <div className={`transition-all duration-500 ${currentSlide === 2 ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                        <div className="flex flex-col items-center">
                            <div className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">The Roadmap</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white text-center mb-2">
                                Three steps to <span className="text-primary">financial freedom.</span>
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-[#cbbc90] text-center mb-6 max-w-md">
                                We've simplified wealth management into a seamless three-step process designed for growth.
                            </p>

                            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                                {steps.map((step) => (
                                    <div key={step.num} className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary text-slate-900 font-bold flex items-center justify-center mb-3">
                                            {step.num}
                                        </div>
                                        <div className="bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-2xl p-5 text-center max-w-[180px]">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-3">
                                                <span className="material-symbols-outlined text-xl text-primary">{step.icon}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-900 dark:text-white mb-1">{step.title}</h3>
                                            <p className="text-xs text-slate-500 dark:text-[#cbbc90]">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Arrow */}
                <button
                    onClick={nextSlide}
                    className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-slate-300 dark:border-[#493f22] flex items-center justify-center text-slate-500 dark:text-[#cbbc90] hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>

                {/* Dot Indicators */}
                <div className="flex items-center gap-2 mt-8">
                    {[0, 1, 2].map((i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i)}
                            className={`transition-all ${currentSlide === i
                                    ? 'w-6 h-2 bg-primary rounded-full'
                                    : 'w-2 h-2 bg-slate-300 dark:bg-[#493f22] rounded-full hover:bg-primary/50'
                                }`}
                        />
                    ))}
                </div>
            </main>

            {/* Footer - CTA Buttons */}
            <footer className="px-6 py-8 flex flex-col items-center gap-3">
                <button
                    onClick={onSignUp}
                    className="w-full max-w-sm bg-primary hover:bg-primary-hover text-slate-900 font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                >
                    Sign Up
                </button>
                <button
                    onClick={onSignIn}
                    className="w-full max-w-sm bg-transparent border-2 border-primary text-primary font-bold py-4 rounded-xl transition-all hover:bg-primary/10 active:scale-[0.98]"
                >
                    Sign In
                </button>
                <span className="text-sm text-slate-400 dark:text-[#cbbc90]/60 hover:text-primary cursor-pointer transition-all">
                    View Live Demo
                </span>
            </footer>
        </div>
    );
};

export default LandingPage;
