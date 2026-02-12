import React, { useState, useEffect } from 'react';
import LandingHeader from './landing/LandingHeader';
import LandingHero from './landing/LandingHero';
import LandingFeatures from './landing/LandingFeatures';
import LandingHowItWorks from './landing/LandingHowItWorks';
import LandingFooter from './landing/LandingFooter';

interface LandingPageProps {
    onSignUp: () => void;
    onSignIn: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignUp, onSignIn }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 3;

    // Auto-rotate slides every 60 seconds (1 minute)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    const goToSlide = (index: number) => setCurrentSlide(index);

    return (
        <div className="h-screen w-full flex flex-col font-display overflow-hidden relative">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <img src="/bg.png" alt="Background" className="w-full h-full object-cover object-center translate-y-20 md:translate-y-0 opacity-50 dark:opacity-40" />
                <div className="absolute inset-0 bg-background-light/45 dark:bg-background-dark/60 backdrop-blur-sm"></div>
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10 flex flex-col h-full w-full">
                <LandingHeader />

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
                        <LandingHero isActive={currentSlide === 0} />
                        <LandingFeatures isActive={currentSlide === 1} onSignUp={onSignUp} />
                        <LandingHowItWorks isActive={currentSlide === 2} />
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

                <LandingFooter onSignUp={onSignUp} onSignIn={onSignIn} />
            </div>
        </div>
    );
};

export default LandingPage;
