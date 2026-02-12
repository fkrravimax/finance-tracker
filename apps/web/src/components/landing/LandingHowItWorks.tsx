import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LandingHowItWorksProps {
    isActive: boolean;
}

const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({ isActive }) => {
    const { t } = useLanguage();

    const steps = [
        { num: 1, icon: 'person_add', title: t('landing.howItWorks.step1Title'), desc: t('landing.howItWorks.step1Desc') },
        { num: 2, icon: 'monitoring', title: t('landing.howItWorks.step2Title'), desc: t('landing.howItWorks.step2Desc') },
        { num: 3, icon: 'trending_up', title: t('landing.howItWorks.step3Title'), desc: t('landing.howItWorks.step3Desc') },
    ];

    return (
        <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out`}
            style={{
                transform: isActive ? 'translateX(0)' : 'translateX(100%)',
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? 'auto' : 'none'
            }}
        >
            <div className="flex flex-col items-center w-full px-2 h-full justify-center">
                <div className="inline-block px-3 py-1 bg-primary/10 dark:bg-primary/20 rounded-full mb-2 md:mb-4">
                    <span className="text-[9px] md:text-xs font-bold text-primary uppercase tracking-wider">The Roadmap</span>
                </div>
                <h2 className="text-lg md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white text-center mb-1 md:mb-3">
                    {t('landing.howItWorks.title')}
                </h2>

                {/* Mobile: Horizontal compact cards */}
                <div className="flex md:hidden gap-2 w-full max-w-sm justify-center items-stretch">
                    {steps.map((step) => (
                        <div key={step.num} className="flex flex-col items-center flex-1 h-full">
                            <div className="w-6 h-6 rounded-full bg-primary text-slate-900 text-xs font-bold flex items-center justify-center mb-2 shrink-0">
                                {step.num}
                            </div>
                            <div className="bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-lg p-2 text-center w-full flex-1 flex flex-col justify-center">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-1 shrink-0">
                                    <span className="material-symbols-outlined text-sm text-primary">{step.icon}</span>
                                </div>
                                <h3 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5">{step.title}</h3>
                                <p className="text-[9px] leading-tight text-slate-500 dark:text-[#cbbc90] flex-1 flex items-center justify-center">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop: Original layout */}
                <div className="hidden md:flex gap-6 lg:gap-8 w-full max-w-4xl justify-center items-stretch">
                    {steps.map((step, idx) => (
                        <div key={step.num} className="flex flex-col items-center flex-1 relative h-full">
                            <div className="w-10 h-10 rounded-full bg-primary text-slate-900 text-base font-bold flex items-center justify-center mb-4 z-10 shrink-0">
                                {step.num}
                            </div>
                            {idx < steps.length - 1 && (
                                <div className="absolute top-5 left-[calc(50%+24px)] w-[calc(100%-48px)] h-[2px] bg-[#493f22]" />
                            )}
                            <div className="bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 text-center w-full flex-1 flex flex-col">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4 shrink-0">
                                    <span className="material-symbols-outlined text-2xl text-primary">{step.icon}</span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-[#cbbc90] leading-relaxed flex-1">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LandingHowItWorks;
