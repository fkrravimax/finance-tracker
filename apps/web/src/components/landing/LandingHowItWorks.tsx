import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

const LandingHowItWorks: React.FC = () => {
    const { t } = useLanguage();

    const steps = [
        {
            num: '01',
            icon: 'person_add',
            title: t('landing.howItWorks.step1Title'),
            desc: t('landing.howItWorks.step1Desc'),
        },
        {
            num: '02',
            icon: 'account_balance_wallet',
            title: t('landing.howItWorks.step2Title'),
            desc: t('landing.howItWorks.step2Desc'),
        },
        {
            num: '03',
            icon: 'insights',
            title: t('landing.howItWorks.step3Title'),
            desc: t('landing.howItWorks.step3Desc'),
        },
    ];

    return (
        <section id="workflow" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 dark:bg-primary/20 rounded-full mb-4 border border-primary/25">
                    <span className="text-xs font-bold text-slate-800 dark:text-[#f4c025] uppercase tracking-wider">
                        {t('landing.howItWorks.badge')}
                    </span>
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                    {t('landing.howItWorks.title')}
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-[#cbbc90] leading-relaxed">
                    {t('landing.howItWorks.subtitle')}
                </p>
            </div>

            {/* Stepper Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
                {steps.map((step, index) => (
                    <motion.div
                        key={step.num}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.5, delay: index * 0.15 }}
                        className="relative bg-white dark:bg-[#252012] border border-slate-200/90 dark:border-[#493f22] p-7 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
                    >
                        <div>
                            {/* Card Top: Number & Icon */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-3xl font-black font-mono text-slate-300 dark:text-[#493f22] group-hover:text-primary transition-colors">
                                    {step.num}
                                </span>
                                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-[#342e1b] border border-primary/20 flex items-center justify-center text-primary transition-transform group-hover:scale-105">
                                    <span className="material-symbols-outlined text-2xl">
                                        {step.icon}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2.5">
                                {step.title}
                            </h3>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-[#cbbc90] leading-relaxed">
                                {step.desc}
                            </p>
                        </div>

                        {/* Subtle step indicator underline */}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#38311a] flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-[#cbbc90]/60">
                            <span>Step {index + 1} of 3</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default LandingHowItWorks;
