import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const LandingHowItWorks: React.FC = () => {
    const { t } = useLanguage();

    const steps = [
        { num: 1, icon: 'person_add', title: t('landing.howItWorks.step1Title'), desc: t('landing.howItWorks.step1Desc') },
        { num: 2, icon: 'monitoring', title: t('landing.howItWorks.step2Title'), desc: t('landing.howItWorks.step2Desc') },
        { num: 3, icon: 'trending_up', title: t('landing.howItWorks.step3Title'), desc: t('landing.howItWorks.step3Desc') },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center">
            <div className="text-center mb-12">
                <div className="inline-block px-3 py-1 bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">The Roadmap</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                    {t('landing.howItWorks.title')}
                </h2>
                <p className="text-lg text-slate-600 dark:text-[#cbbc90] max-w-2xl">
                    Get started in minutes and take control of your financial future.
                </p>
            </div>

            {/* Mobile: Vertical Stack */}
            <div className="flex md:hidden flex-col gap-6 w-full max-w-sm">
                {steps.map((step) => (
                    <div key={step.num} className="flex gap-4 items-start bg-white dark:bg-[#2b2616] p-4 rounded-2xl border border-slate-200 dark:border-[#493f22] shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-primary text-slate-900 text-lg font-bold flex items-center justify-center shrink-0">
                            {step.num}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{step.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-[#cbbc90] leading-relaxed">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop: Horizontal Steps */}
            <div className="hidden md:flex gap-8 lg:gap-12 w-full justify-center items-start relative mt-8">
                {/* Connecting Line */}
                <div className="absolute top-12 left-[10%] w-[80%] h-0.5 bg-slate-200 dark:bg-[#493f22] -z-10"></div>

                {steps.map((step) => (
                    <div key={step.num} className="flex flex-col items-center flex-1 max-w-xs relative group">
                        <div className="w-24 h-24 rounded-3xl bg-white dark:bg-[#2b2616] border-2 border-slate-100 dark:border-[#493f22] flex items-center justify-center mb-6 shadow-xl group-hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-primary">{step.icon}</span>
                            </div>
                            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-slate-900 font-bold flex items-center justify-center shadow-lg">
                                {step.num}
                            </div>
                        </div>

                        <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-3 text-center">{step.title}</h3>
                        <p className="text-slate-500 dark:text-[#cbbc90] text-center leading-relaxed">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LandingHowItWorks;
