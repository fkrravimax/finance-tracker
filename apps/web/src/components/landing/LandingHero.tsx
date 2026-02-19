import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { StaggerContainer, StaggerItem, ScaleButton } from '../ui/Motion';

interface LandingHeroProps {
    onSignUp: () => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onSignUp }) => {
    const { t, language } = useLanguage();

    return (
        <StaggerContainer className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-12 md:gap-8">
            {/* Text Content */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10">
                <StaggerItem>
                    <div className="inline-block px-3 py-1 bg-primary/10 dark:bg-primary/20 rounded-full mb-6 border border-primary/20">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            {language === 'en' ? 'The Ultimate Finance Tracker' : 'Aplikasi Keuangan Terbaik'}
                        </span>
                    </div>
                </StaggerItem>

                <StaggerItem>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                        {t('landing.hero.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-300 animate-pulse">{t('landing.hero.titleHighlight')}</span>
                    </h1>
                </StaggerItem>

                <StaggerItem>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-[#cbbc90] mb-8 max-w-xl leading-relaxed">
                        {t('landing.hero.subtitle')}
                    </p>
                </StaggerItem>

                <StaggerItem className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <ScaleButton
                        onClick={onSignUp}
                        className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-hover text-slate-900 font-bold text-lg rounded-2xl transition-all shadow-xl hover:shadow-primary/25 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {t('landing.hero.getStarted')}
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </ScaleButton>

                    <a
                        href="/privacy"
                        className="text-sm font-bold text-slate-500 dark:text-[#cbbc90]/70 hover:text-primary transition-colors flex items-center gap-2 px-4 py-2 md:hidden"
                    >
                        <span className="material-symbols-outlined text-lg">verified_user</span>
                        {language === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}
                    </a>
                </StaggerItem>
            </div>

            {/* Hero Image */}

        </StaggerContainer>
    );
};

export default LandingHero;
