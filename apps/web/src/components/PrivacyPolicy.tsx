import React, { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppearance } from '../contexts/AppearanceContext';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
    const { t } = useLanguage();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#1e1b10]/80 border-b border-slate-200 dark:border-[#493f22] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Rupiku" className="w-8 h-8" />
                    <span className="text-xl font-black tracking-tight">Rupiku</span>
                </div>
                <Link to="/" className="text-sm font-bold text-primary hover:text-primary-hover transition-colors">
                    {t('common.back') || 'Back'}
                </Link>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-black mb-8 text-center">{t('privacy.title') || 'Privacy Policy'}</h1>

                <div className="space-y-8 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{t('privacy.intro.title') || 'Introduction'}</h2>
                        <p>{t('privacy.intro.content') || 'Welcome to Rupiku. We value your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and share information about you when you use our website and services.'}</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{t('privacy.collection.title') || 'Information We Collect'}</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>{t('privacy.collection.personal') || 'Personal Information'}:</strong> Name, email address, and other contact details you provide.</li>
                            <li><strong>{t('privacy.collection.financial') || 'Financial Data'}:</strong> Transaction history, budget details, and savings goals you input into the app.</li>
                            <li><strong>{t('privacy.collection.usage') || 'Usage Data'}:</strong> Information on how you interact with the app, device information, and log data.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{t('privacy.usage.title') || 'How We Use Your Information'}</h2>
                        <p>{t('privacy.usage.desc') || 'We use the collected data to:'}</p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>Provide and maintain the Rupiku service.</li>
                            <li>Personalize your experience and dashboard.</li>
                            <li>Improve our app functionality and user interface.</li>
                            <li>Communicate with you regarding updates or support.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{t('privacy.sharing.title') || 'Data Sharing'}</h2>
                        <p>{t('privacy.sharing.content') || 'We do not sell your personal data. We may share information with third-party service providers who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.'}</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{t('privacy.security.title') || 'Data Security'}</h2>
                        <p>{t('privacy.security.content') || 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.'}</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{t('privacy.contact.title') || 'Contact Us'}</h2>
                        <p>{t('privacy.contact.content') || 'If you have any questions about this Privacy Policy, please contact us at:'}</p>
                        <a href="mailto:ahmadfikriraf@gmail.com" className="text-primary font-bold hover:underline mt-2 inline-block">ahmadfikriraf@gmail.com</a>
                    </section>
                </div>
            </main>

            <footer className="border-t border-slate-200 dark:border-[#493f22] bg-surface-light dark:bg-[#1e1b10] py-8 text-center text-sm text-slate-500 dark:text-[#cbbc90]">
                <p>&copy; {new Date().getFullYear()} Rupiku. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;
