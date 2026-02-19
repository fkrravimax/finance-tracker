import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FadeIn } from '../ui/Motion';

interface LandingFeaturesProps {
    onSignUp: () => void;
}

const LandingFeatures: React.FC<LandingFeaturesProps> = ({ onSignUp }) => {
    const { t } = useLanguage();

    const features = [
        {
            icon: 'dashboard',
            label: t('landing.features.dashboard'),
            desc: t('landing.features.dashboardDesc'),
            preview: '/feature-dashboard.jpg',
            align: 'right' // Image on right
        },
        {
            icon: 'savings',
            label: t('landing.features.savings'),
            desc: t('landing.features.savingsDesc'),
            preview: '/feature-savings.jpg',
            align: 'left' // Image on left
        },
        {
            icon: 'trending_up',
            label: t('landing.features.trading'),
            desc: t('landing.features.tradingDesc'),
            preview: '/feature-trading.jpg',
            align: 'right'
        },
        {
            icon: 'receipt_long',
            label: t('landing.features.transactions'),
            desc: t('landing.features.transactionsDesc'),
            preview: '/feature-transactions.jpg', // Reusing hero image as it likely contains transactions
            align: 'left'
        },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-24 md:gap-32">
            <div className="text-center max-w-3xl mx-auto mb-8">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                    {t('landing.features.title') || "Powerful Features"}
                </h2>
                <p className="text-lg text-slate-600 dark:text-[#cbbc90]">
                    {t('landing.features.subtitle') || "Everything you need to manage your wealth in one place."}
                </p>
            </div>

            {features.map((feature, index) => (
                <FadeIn
                    key={index}
                    direction={feature.align === 'left' ? 'right' : 'left'}
                    className={`flex flex-col md:flex-row items-center gap-12 lg:gap-20 ${feature.align === 'left' ? 'md:flex-row-reverse' : ''
                        }`}
                >
                    {/* Text Side */}
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-primary">
                                {feature.icon}
                            </span>
                        </div>

                        <h3 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white">
                            {feature.label}
                        </h3>

                        <p className="text-lg text-slate-600 dark:text-[#cbbc90] leading-relaxed">
                            {feature.desc}
                        </p>

                        <button
                            onClick={onSignUp}
                            className="text-primary font-bold hover:underline flex items-center gap-2"
                        >
                            {t('landing.features.learnMore')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>

                    {/* Image Side */}
                    <div className="flex-1 w-full perspective-1000 group">
                        <div className={`relative transform transition-all duration-700 hover:scale-[1.02] ${feature.align === 'left'
                            ? 'md:rotate-y-3 md:hover:rotate-y-6'
                            : 'md:-rotate-y-3 md:hover:-rotate-y-6'
                            }`}>
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>
                            <img
                                src={feature.preview}
                                alt={feature.label}
                                className="w-full h-auto rounded-3xl shadow-2xl border border-slate-200/50 dark:border-[#493f22]/50 backdrop-blur-sm bg-background-light dark:bg-background-dark/50"
                            />
                        </div>
                    </div>
                </FadeIn>
            ))}
        </div>
    );
};

export default LandingFeatures;
