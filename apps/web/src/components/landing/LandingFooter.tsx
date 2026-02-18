import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LandingFooterProps {
    onSignIn: () => void;
}

const LandingFooter: React.FC<LandingFooterProps> = ({ onSignIn }) => {
    const { t } = useLanguage();

    return (
        <footer className="px-4 md:px-12 lg:px-20 py-8 shrink-0 mt-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Copyright / Brand */}
                <div className="text-center md:text-left">
                    <p className="font-bold text-slate-900 dark:text-white">Rupiku</p>
                    <p className="text-xs text-slate-500 dark:text-[#cbbc90]">
                        &copy; {new Date().getFullYear()} Rupiku Finance. All rights reserved.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6">

                </div>
            </div>
        </footer>
    );
};

export default LandingFooter;
