import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppearance } from '../../contexts/AppearanceContext';

const LandingHeader: React.FC = () => {
    const { language, setLanguage } = useLanguage();
    const { theme, setTheme } = useAppearance();

    return (
        <header className="relative flex items-center justify-between px-4 md:px-12 lg:px-20 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 md:py-6 shrink-0 border-b border-transparent md:border-slate-200/10">
            <div className="flex items-center gap-2 md:gap-3">
                <img src="/logo.png" alt="Rupiku" className="w-8 h-8 md:w-10 md:h-10" />
                <span className="text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent transition-all">
                    Rupiku<span className="text-primary inline-block transform translate-y-[2px]">.</span>
                </span>
            </div>

            {/* Centered Links (Desktop) */}
            <nav className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 hidden md:flex items-center gap-8">
                <a
                    href="mailto:ahmadfikriraf@gmail.com"
                    className="text-slate-500 dark:text-[#cbbc90] hover:text-primary cursor-pointer transition-all font-bold text-sm"
                >
                    Help Center
                </a>
                <a
                    href="/privacy"
                    className="text-slate-500 dark:text-[#cbbc90] hover:text-primary cursor-pointer transition-all font-bold text-sm"
                >
                    {language === 'en' ? 'Privacy' : 'Privasi'}
                </a>
            </nav>

            <div className="flex items-center gap-2 md:gap-4">
                {/* Language Toggle */}
                <button
                    onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-full text-slate-500 dark:text-[#cbbc90] hover:text-primary hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all text-sm font-bold"
                    title={language === 'en' ? 'Switch to Indonesian' : 'Switch to English'}
                >
                    <span className="material-symbols-outlined text-lg">language</span>
                    <span className="uppercase">{language}</span>
                </button>
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all"
                    title="Toggle Theme"
                >
                    <span className="material-symbols-outlined text-xl">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
            </div>
        </header>
    );
};

export default LandingHeader;
