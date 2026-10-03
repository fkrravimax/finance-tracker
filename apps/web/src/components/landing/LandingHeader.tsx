import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppearance } from '../../contexts/AppearanceContext';
import LogoText from '../LogoText';

interface LandingHeaderProps {
    onSignIn: () => void;
    onSignUp: () => void;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ onSignIn, onSignUp }) => {
    const { t, language, setLanguage } = useLanguage();
    const { theme, setTheme } = useAppearance();

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background-light/85 dark:bg-background-dark/85 border-b border-slate-200/60 dark:border-[#493f22]/50 transition-colors">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 md:py-4">
                {/* Brand / Logo */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <img src="/logo.png" alt="Rupiku Logo" className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain shrink-0" />
                    <LogoText className="text-lg sm:text-xl md:text-2xl" />
                </div>

                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex items-center gap-7">
                    <a
                        href="#features"
                        onClick={(e) => scrollToSection(e, 'features')}
                        className="text-slate-600 dark:text-[#cbbc90] hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-semibold"
                    >
                        {t('landing.header.features') || 'Features'}
                    </a>
                    <a
                        href="#workflow"
                        onClick={(e) => scrollToSection(e, 'workflow')}
                        className="text-slate-600 dark:text-[#cbbc90] hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-semibold"
                    >
                        {t('landing.header.howItWorks') || 'Workflow'}
                    </a>
                    <a
                        href="/privacy"
                        className="text-slate-600 dark:text-[#cbbc90] hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-semibold"
                    >
                        {t('landing.header.privacy')}
                    </a>
                    <a
                        href="mailto:ahmadfikriraf@gmail.com"
                        className="text-slate-600 dark:text-[#cbbc90] hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-semibold"
                    >
                        {t('landing.header.helpCenter')}
                    </a>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
                    {/* Language Switcher */}
                    <button
                        type="button"
                        onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
                        className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-600 dark:text-[#cbbc90] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2b2616] border border-transparent hover:border-slate-200 dark:hover:border-[#493f22] transition-all text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                        title={language === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
                        aria-label="Toggle language"
                    >
                        <span className="material-symbols-outlined text-[15px] sm:text-[17px]">language</span>
                        <span>{language}</span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-1 sm:p-1.5 md:p-2 rounded-lg text-slate-600 dark:text-[#cbbc90] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all"
                        title="Toggle theme"
                        aria-label="Toggle dark or light theme"
                    >
                        <span className="material-symbols-outlined text-[18px] sm:text-[19px]">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    <div className="h-4 sm:h-5 w-[1px] bg-slate-200 dark:bg-[#493f22]/70 mx-0.5 sm:mx-1"></div>

                    {/* Sign In CTA - Visible on ALL screen sizes */}
                    <button
                        type="button"
                        onClick={onSignIn}
                        className="px-2.5 sm:px-3.5 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-[#e4d7a8] hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-colors rounded-lg sm:rounded-xl whitespace-nowrap"
                    >
                        {t('landing.header.signIn') || 'Sign In'}
                    </button>

                    {/* Get Started CTA - Only visible on Tablet/Desktop (sm:) to prevent header crowding on Mobile */}
                    <button
                        type="button"
                        onClick={onSignUp}
                        className="hidden sm:inline-flex items-center px-3.5 sm:px-4 py-2 bg-primary hover:bg-primary-hover text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-primary/20 active:scale-[0.98] whitespace-nowrap"
                    >
                        {t('landing.header.getStarted') || 'Get Started'}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default LandingHeader;
