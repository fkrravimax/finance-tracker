import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LandingFooterProps {
    onSignUp: () => void;
    onSignIn: () => void;
}

const LandingFooter: React.FC<LandingFooterProps> = ({ onSignUp, onSignIn }) => {
    const { t } = useLanguage();

    return (
        <footer className="px-4 md:px-12 lg:px-20 py-4 md:py-6 shrink-0">
            <div className="flex flex-col items-center gap-2 md:hidden">
                <button
                    onClick={onSignUp}
                    className="w-full max-w-sm bg-primary hover:bg-primary-hover text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                >
                    {t('landing.hero.getStarted')}
                </button>
                <button
                    onClick={onSignIn}
                    className="w-full max-w-sm bg-transparent border-2 border-primary text-primary font-bold py-3 rounded-xl transition-all hover:bg-primary/10 active:scale-[0.98]"
                >
                    {t('landing.hero.signIn')}
                </button>
                <span className="text-xs text-slate-400 dark:text-[#cbbc90]/60 hover:text-primary cursor-pointer transition-all">
                    View Live Demo
                </span>
            </div>

            <div className="hidden md:flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onSignIn}
                        className="text-slate-500 dark:text-[#cbbc90] hover:text-primary font-medium transition-all"
                    >
                        {t('landing.hero.signIn')}
                    </button>
                    <button className="px-6 py-3 rounded-xl border border-slate-300 dark:border-[#493f22] text-slate-700 dark:text-white font-bold hover:bg-slate-100 dark:hover:bg-[#2b2616] transition-all">
                        Live Demo
                    </button>
                </div>
                <button
                    onClick={onSignUp}
                    className="px-8 py-3 bg-primary hover:bg-primary-hover text-slate-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/25 active:scale-[0.98] flex items-center gap-2"
                >
                    {t('landing.hero.getStarted')}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
            </div>
        </footer>
    );
};

export default LandingFooter;
