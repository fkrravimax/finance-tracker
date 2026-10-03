import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import LogoText from '../LogoText';

interface LandingFooterProps {
    onSignIn: () => void;
}

const LandingFooter: React.FC<LandingFooterProps> = ({ onSignIn }) => {
    const { t } = useLanguage();

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="w-full border-t border-slate-200/70 dark:border-[#493f22]/50 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8 shrink-0 mt-auto relative z-10">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12">
                {/* Brand & Mission Statement */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <img src="/logo.png" alt="Rupiku" className="w-7 h-7 object-contain" />
                        <LogoText className="text-xl" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#cbbc90] leading-relaxed mb-4">
                        {t('landing.footer.description')}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-[#cbbc90]/60">
                        &copy; {new Date().getFullYear()} Rupiku Finance. {t('landing.footer.copyright')}
                    </p>
                </div>

                {/* Quick Links & Actions */}
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-8 gap-y-3 text-xs sm:text-sm font-semibold text-slate-600 dark:text-[#cbbc90]">
                    <a
                        href="#features"
                        onClick={(e) => scrollToSection(e, 'features')}
                        className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        {t('landing.header.features') || 'Features'}
                    </a>
                    <a
                        href="#workflow"
                        onClick={(e) => scrollToSection(e, 'workflow')}
                        className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        {t('landing.header.howItWorks') || 'Workflow'}
                    </a>
                    <a
                        href="/privacy"
                        className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        {t('landing.header.privacy')}
                    </a>
                    <a
                        href="mailto:ahmadfikriraf@gmail.com"
                        className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        {t('landing.header.helpCenter')}
                    </a>
                    <button
                        type="button"
                        onClick={onSignIn}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#2b2616] text-slate-800 dark:text-[#f4c025] hover:bg-slate-200 dark:hover:bg-[#38311a] transition-colors font-bold"
                    >
                        {t('landing.header.signIn')}
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default LandingFooter;
