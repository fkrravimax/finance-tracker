import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';

interface LandingCTAProps {
    onSignUp: () => void;
}

const LandingCTA: React.FC<LandingCTAProps> = ({ onSignUp }) => {
    const { t } = useLanguage();

    const scrollToFeatures = (e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById('features');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6 }}
                className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-[#493f22] bg-gradient-to-b from-white to-slate-50 dark:from-[#252012] dark:to-[#1b170c] p-8 sm:p-12 md:p-16 text-center shadow-xl"
            >
                {/* Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/15 dark:bg-primary/20 blur-3xl -z-10 rounded-full pointer-events-none" />

                <div className="max-w-3xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 dark:bg-primary/20 rounded-full mb-6 border border-primary/25">
                        <span className="text-xs font-bold text-slate-800 dark:text-[#f4c025] uppercase tracking-wider">
                            {t('landing.cta.badge')}
                        </span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-5">
                        {t('landing.cta.title')}
                    </h2>

                    <p className="text-base sm:text-lg text-slate-600 dark:text-[#cbbc90] mb-8 max-w-2xl mx-auto leading-relaxed">
                        {t('landing.cta.subtitle')}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
                        <button
                            type="button"
                            onClick={onSignUp}
                            className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-hover text-slate-950 font-bold text-base rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            <span>{t('landing.cta.button')}</span>
                            <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                                arrow_forward
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={scrollToFeatures}
                            className="w-full sm:w-auto px-7 py-3.5 bg-white dark:bg-[#342e1b] hover:bg-slate-50 dark:hover:bg-[#3d3620] text-slate-800 dark:text-[#f4c025] font-bold text-base rounded-xl border border-slate-200 dark:border-[#493f22] transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">explore</span>
                            <span>{t('landing.cta.explore')}</span>
                        </button>
                    </div>

                    {/* Trust and Security Points */}
                    <div className="pt-8 border-t border-slate-200/80 dark:border-[#493f22]/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600 dark:text-[#cbbc90]">
                        <div className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-base">lock</span>
                            <span>{t('landing.cta.securityPoint1')}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-base">shield</span>
                            <span>{t('landing.cta.securityPoint2')}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-base">cloud_download</span>
                            <span>{t('landing.cta.securityPoint3')}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default LandingCTA;
