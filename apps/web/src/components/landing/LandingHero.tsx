import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LandingHeroProps {
    isActive: boolean;
}

const LandingHero: React.FC<LandingHeroProps> = ({ isActive }) => {
    const { t, language } = useLanguage();

    return (
        <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${isActive
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-full' // Simplified for now, parent handles direction if needed or we assume simple fade/slide
                }`}
            style={{
                transform: isActive ? 'translateX(0)' : 'translateX(-100%)', // Override for simple slide logic managed by parent index
                opacity: isActive ? 1 : 0
            }}
        >
            <div className="flex flex-col items-center text-center px-4">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 md:mb-6">
                    {t('landing.hero.title')} <span className="text-primary">{t('landing.hero.titleHighlight')}</span>
                </h1>
                <p className="text-base md:text-xl text-slate-500 dark:text-[#cbbc90] max-w-xl">
                    {t('landing.hero.subtitle')}
                </p>
                <a
                    href="/privacy"
                    className="mt-6 md:hidden text-xs font-bold text-slate-400 dark:text-[#cbbc90]/70 hover:text-primary transition-colors flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true" translate="no">verified_user</span>
                    {language === 'en' ? 'View Privacy Policy' : 'Lihat Kebijakan Privasi'}
                </a>
            </div>
        </div>
    );
};

export default LandingHero;
