import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

interface LandingHeroProps {
    onSignUp: () => void;
    onSignIn: () => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onSignUp, onSignIn }) => {
    const { t } = useLanguage();

    return (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            {/* Left Column: Copy & CTAs */}
            <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left z-10 max-w-2xl">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/25 mb-6 text-slate-800 dark:text-[#f4c025]"
                >
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {t('landing.hero.badge')}
                    </span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12] mb-6"
                >
                    {t('landing.hero.title')}{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-primary to-yellow-400">
                        {t('landing.hero.titleHighlight')}
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-[#cbbc90] mb-8 leading-relaxed max-w-xl font-normal"
                >
                    {t('landing.hero.subtitle')}
                </motion.p>

                {/* Dual CTA Group */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto"
                >
                    <button
                        type="button"
                        onClick={onSignUp}
                        className="px-7 py-3.5 bg-primary hover:bg-primary-hover text-slate-950 font-bold text-base rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] flex items-center justify-center gap-2 group"
                    >
                        <span>{t('landing.hero.getStarted')}</span>
                        <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                            arrow_forward
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onSignIn}
                        className="px-6 py-3.5 bg-white dark:bg-[#2b2616] hover:bg-slate-50 dark:hover:bg-[#342e1b] text-slate-800 dark:text-[#f4c025] font-bold text-base rounded-xl border border-slate-200 dark:border-[#493f22] transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">login</span>
                        <span>{t('landing.hero.signIn')}</span>
                    </button>
                </motion.div>

                {/* Trust Signal / Guarantee */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-[#cbbc90]/80 font-medium"
                >
                    <span className="material-symbols-outlined text-[17px] text-emerald-500">
                        verified_user
                    </span>
                    <span>{t('landing.hero.trustNote')}</span>
                </motion.div>
            </div>

            {/* Right Column: High-Res App Mockup Showcase */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-1 w-full max-w-xl lg:max-w-2xl relative"
            >
                {/* Ambient Glow Backdrop */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 via-amber-500/10 to-transparent blur-3xl -z-10 rounded-3xl opacity-70 dark:opacity-50" />

                <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-[#493f22]/70 shadow-2xl bg-white/40 dark:bg-[#1a160b]/40 backdrop-blur-sm group">
                    <img
                        src="/hero-content.png"
                        alt="Rupiku Finance Dashboard Interface Preview"
                        className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-[1.01]"
                        loading="eager"
                    />

                    {/* Subtle Overlay Badge on Mockup */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-auto bg-white/90 dark:bg-[#1f1a0e]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-[#493f22] shadow-md flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-[#f4c025]">
                            Clean Mode & Multi-Wallet Sync
                        </span>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default LandingHero;
