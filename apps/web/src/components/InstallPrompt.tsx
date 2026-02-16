import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const InstallPrompt: React.FC = () => {
    const { t } = useLanguage();
    // currentTheme not needed for now as we use Tailwind classes
    const [showPrompt, setShowPrompt] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // 1. Check if already in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return;

        // 2. Check if dismissed recently (e.g., in last 7 days)
        const lastDismissed = localStorage.getItem('installPromptDismissed');
        if (lastDismissed) {
            const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) return;
        }

        // 3. Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        const isMobile = isIOS || isAndroid;

        if (!isMobile) return; // Don't show on desktop for now

        if (isIOS) {
            setPlatform('ios');
            // Show after a small delay to let app load
            setTimeout(() => setShowPrompt(true), 3000);
        } else if (isAndroid) {
            setPlatform('android');
            // Listen for beforeinstallprompt
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setShowPrompt(true);
            });
        }
    }, []);

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('installPromptDismissed', Date.now().toString());
    };

    const handleAndroidInstall = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                setDeferredPrompt(null);
                setShowPrompt(false);
            });
        }
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none p-4 pb-6 md:pb-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={handleDismiss} />

            {/* Modal Content */}
            <div className={`
                relative pointer-events-auto w-full max-w-md mx-auto
                bg-white dark:bg-[#1e1b10] 
                rounded-3xl shadow-2xl border border-slate-200 dark:border-[#f4c025]/20
                flex flex-col overflow-hidden animate-slide-up
            `}>
                {/* Header with Close Button */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#f4c025]/10 bg-slate-50/80 dark:bg-[#2b2616]/80 backdrop-blur-md">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-md">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                        </span>
                        {t('install.title') || 'Install Rupiku'}
                    </h3>
                    <button onClick={handleDismiss} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-slate-500 dark:text-[#cbbc90]">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto max-h-[70vh]">
                    <p className="text-slate-600 dark:text-[#cbbc90] mb-6 text-sm leading-relaxed">
                        {t('install.description') || 'Install Rupiku app for a faster, better experience. No app store needed!'}
                    </p>

                    {platform === 'ios' && (
                        <div className="space-y-6">
                            {/* Step 1 */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-[#f4c025] text-white dark:text-black flex items-center justify-center text-xs font-bold">1</span>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">Tap the "Share" button</p>
                                </div>
                                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#f4c025]/20 shadow-sm">
                                    <img src="/install-guide/step1.png" alt="Step 1" className="w-full h-auto object-cover" />
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-[#f4c025] text-white dark:text-black flex items-center justify-center text-xs font-bold">2</span>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">Scroll down & tap "Add to Home Screen"</p>
                                </div>
                                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#f4c025]/20 shadow-sm">
                                    <img src="/install-guide/step2.png" alt="Step 2" className="w-full h-auto object-cover" />
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-[#f4c025] text-white dark:text-black flex items-center justify-center text-xs font-bold">3</span>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">Confirm by tapping "Add"</p>
                                </div>
                                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#f4c025]/20 shadow-sm">
                                    <img src="/install-guide/step3.png" alt="Step 3" className="w-full h-auto object-cover" />
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-[#f4c025] text-white dark:text-black flex items-center justify-center text-xs font-bold">4</span>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">Success! Launch from home screen.</p>
                                </div>
                                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#f4c025]/20 shadow-sm">
                                    <img src="/install-guide/step4.png" alt="Step 4" className="w-full h-auto object-cover" />
                                </div>
                            </div>
                        </div>
                    )}

                    {platform === 'android' && (
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleAndroidInstall}
                                className="w-full py-3.5 bg-slate-900 dark:bg-[#f4c025] text-white dark:text-black font-bold rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-[#f4c025]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">install_mobile</span>
                                {t('install.button') || 'Install App'}
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="w-full py-3 text-slate-500 dark:text-[#cbbc90] font-bold text-sm hover:text-slate-800 dark:hover:text-white transition-colors"
                            >
                                {t('common.maybeLater') || 'Maybe Later'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
