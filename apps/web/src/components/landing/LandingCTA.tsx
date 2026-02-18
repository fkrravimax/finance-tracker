import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LandingCTAProps {
    onSignUp: () => void;
}

const LandingCTA: React.FC<LandingCTAProps> = ({ onSignUp }) => {
    const { t } = useLanguage();

    return (
        <section className="w-full py-24 px-4 md:px-8 relative">
            {/* Faded Background Layer */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5 dark:from-[#2b2616]/0 dark:via-primary/5 dark:to-primary/5 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] -z-10 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                    {t('landing.cta.title') || "Ready to Master Your Finance?"}
                </h2>
                <p className="text-lg md:text-xl text-slate-600 dark:text-[#cbbc90] mb-8 max-w-2xl mx-auto">
                    {t('landing.cta.subtitle') || "Join thousands of users who are already tracking their wealth with Rupiku."}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={onSignUp}
                        className="px-8 py-4 bg-primary hover:bg-primary-hover text-slate-900 font-bold text-lg rounded-2xl transition-all shadow-lg hover:shadow-primary/25 active:scale-[0.98] w-full sm:w-auto"
                    >
                        {t('landing.hero.getStarted')}
                    </button>
                    <button className="px-8 py-4 bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] text-slate-900 dark:text-white font-bold text-lg rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-[#1a160b] w-full sm:w-auto">
                        View Demo
                    </button>
                </div>
            </div>

            {/* Abstract Background Shapes (Faded) */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 -z-10 pointer-events-none opacity-50"></div>
        </section>
    );
};

export default LandingCTA;
