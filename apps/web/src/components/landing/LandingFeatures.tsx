import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

interface LandingFeaturesProps {
    onSignUp: () => void;
}

const LandingFeatures: React.FC<LandingFeaturesProps> = ({ onSignUp }) => {
    const { t } = useLanguage();

    const features = [
        {
            tag: '01 / DASHBOARD',
            icon: 'dashboard',
            label: t('landing.features.dashboard'),
            desc: t('landing.features.dashboardDesc'),
            preview: '/feature-dashboard.jpg',
            highlights: ['Real-time Net Cash Flow', 'Automated Burn Rate Alerts', 'Multi-currency support'],
            align: 'right',
        },
        {
            tag: '02 / LEDGER & AUDIT',
            icon: 'receipt_long',
            label: t('landing.features.transactions'),
            desc: t('landing.features.transactionsDesc'),
            preview: '/feature-transactions.jpg',
            highlights: ['Instant Category Tagging', 'Multi-Account Transfers', 'Search & Filtering'],
            align: 'left',
        },
        {
            tag: '03 / GOALS & RESERVES',
            icon: 'savings',
            label: t('landing.features.savings'),
            desc: t('landing.features.savingsDesc'),
            preview: '/feature-savings.jpg',
            highlights: ['Emergency Fund Vault', 'Milestone Projection', 'Target Progress Analytics'],
            align: 'right',
        },
        {
            tag: '04 / ASSET JOURNAL',
            icon: 'trending_up',
            label: t('landing.features.trading'),
            desc: t('landing.features.tradingDesc'),
            preview: '/feature-trading.jpg',
            highlights: ['Execution History', 'Risk-to-Reward Calculator', 'Portfolio Growth Curves'],
            align: 'left',
        },
    ];

    return (
        <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 dark:bg-primary/20 rounded-full mb-4 border border-primary/25">
                    <span className="text-xs font-bold text-slate-800 dark:text-[#f4c025] uppercase tracking-wider">
                        {t('landing.features.badge')}
                    </span>
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                    {t('landing.features.title')}
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-[#cbbc90] leading-relaxed">
                    {t('landing.features.subtitle')}
                </p>
            </div>

            {/* Feature Rows */}
            <div className="flex flex-col gap-20 md:gap-32">
                {features.map((feature, index) => {
                    const isImageLeft = feature.align === 'left';
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.6 }}
                            className={`flex flex-col lg:flex-row items-center gap-10 lg:gap-16 ${
                                isImageLeft ? 'lg:flex-row-reverse' : ''
                            }`}
                        >
                            {/* Text Column */}
                            <div className="flex-1 flex flex-col items-start text-left space-y-5">
                                <span className="text-xs font-bold tracking-widest text-primary font-mono">
                                    {feature.tag}
                                </span>

                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/15 dark:bg-[#342e1b] border border-primary/30 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-2xl">
                                            {feature.icon}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {feature.label}
                                    </h3>
                                </div>

                                <p className="text-slate-600 dark:text-[#cbbc90] text-base sm:text-lg leading-relaxed">
                                    {feature.desc}
                                </p>

                                {/* Micro Highlights */}
                                <ul className="space-y-2 pt-2">
                                    {feature.highlights.map((item, hIdx) => (
                                        <li
                                            key={hIdx}
                                            className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-[#e4d7a8]"
                                        >
                                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-bold">
                                                ✓
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    type="button"
                                    onClick={onSignUp}
                                    className="inline-flex items-center gap-2 pt-2 text-primary hover:text-primary-hover font-bold text-sm tracking-wide transition-colors group"
                                >
                                    <span>{t('landing.features.explore')}</span>
                                    <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                                        arrow_forward
                                    </span>
                                </button>
                            </div>

                            {/* Image Showcase Column - Flat, Crisp & High Elevation */}
                            <div className="flex-1 w-full">
                                <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-[#493f22] bg-white dark:bg-[#1a160b] shadow-xl group">
                                    {/* Ambient card glow */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <img
                                        src={feature.preview}
                                        alt={feature.label}
                                        className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-[1.015]"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};

export default LandingFeatures;
