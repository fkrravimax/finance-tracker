import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useAppearance } from '../contexts/AppearanceContext';
import { useLanguage } from '../contexts/LanguageContext';
import LogoText from './LogoText';
import InstallPrompt from './InstallPrompt';

interface LoginProps {
    onLogin: () => void;
    onBack?: () => void;
    defaultSignUp?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack, defaultSignUp = false }) => {
    const [isSignUp, setIsSignUp] = useState(defaultSignUp);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { theme, setTheme } = useAppearance();
    const { t, language, setLanguage } = useLanguage();

    // Set initial sign up mode from props
    useEffect(() => {
        setIsSignUp(defaultSignUp);
    }, [defaultSignUp]);

    // Password strength calculation for sign up
    const getPasswordStrength = (pwd: string) => {
        if (!pwd) return { score: 0, text: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)) score++;
        if (/[^a-zA-Z0-9]/.test(pwd) || (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && pwd.length >= 10)) score++;

        if (score === 1) return { score: 1, text: t('auth.strengthWeak'), color: 'bg-rose-500' };
        if (score === 2) return { score: 2, text: t('auth.strengthMedium'), color: 'bg-amber-500' };
        return { score: 3, text: t('auth.strengthStrong'), color: 'bg-emerald-500' };
    };

    const passwordStrength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (isSignUp) {
                await authService.register(name, email, password);
                onLogin();
            } else {
                await authService.login(email, password);
                onLogin();
            }
        } catch (err: any) {
            console.error("Auth failed", err);
            setError(err.message || (isSignUp ? 'Registration failed. Please check your data.' : 'Invalid email or password.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        setIsLoading(true);
        setError(null);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        window.location.href = `${apiUrl}/api/auth/google/redirect`;
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError(null);
        setEmail('');
        setPassword('');
        setName('');
    };

    return (
        <>
            <div
                className="min-h-[100dvh] w-full flex flex-col items-center justify-center font-display relative overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-8"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 2rem)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 2rem)',
                }}
            >
                {/* High-Performance Ambient Background (Pure CSS, 0 Bandwidth) */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px]" />
                    <div className="absolute top-[40%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-amber-500/10 dark:bg-[#f4c025]/5 blur-[140px]" />
                    <div
                        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.18]"
                        style={{
                            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
                            backgroundSize: '28px 28px',
                            color: 'var(--color-primary-val)',
                        }}
                    />
                </div>

                {/* Card Container */}
                <div className="w-full max-w-md bg-white dark:bg-[#252012] rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 dark:border-[#493f22] relative z-10 my-auto shrink-0 transition-all">
                    {/* Header */}
                    <div className="bg-slate-50/70 dark:bg-[#2e2717] px-6 py-6 sm:px-8 sm:py-7 text-center border-b border-slate-100 dark:border-[#493f22] relative">
                        {/* Top-Left Back Button */}
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="absolute top-4 left-4 p-2 rounded-full text-slate-500 dark:text-[#cbbc90] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#3d341f] transition-all"
                                title={t('auth.backToLanding')}
                                aria-label="Back to Landing"
                            >
                                <span className="material-symbols-outlined text-xl">arrow_back</span>
                            </button>
                        )}

                        {/* Top-Right Controls: Language & Theme */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
                                className="px-2 py-1 rounded-md text-[11px] font-bold uppercase text-slate-500 dark:text-[#cbbc90] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#3d341f] transition-all"
                                title="Switch language"
                            >
                                {language}
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-1.5 rounded-full text-slate-500 dark:text-[#cbbc90] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#3d341f] transition-all"
                                title="Toggle Theme"
                                aria-label="Toggle theme"
                            >
                                <span className="material-symbols-outlined text-[19px]">
                                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>
                        </div>

                        {/* Logo & Headline */}
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mb-2.5">
                            <img src="/logo.png" alt="Rupiku Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <LogoText className="text-2xl sm:text-3xl" />
                        </div>
                        <h2 className="text-slate-800 dark:text-white font-bold mt-3 text-lg sm:text-xl">
                            {isSignUp ? t('auth.signUpTitle') : t('auth.title')}
                        </h2>
                        <p className="text-slate-500 dark:text-[#cbbc90] text-xs sm:text-sm mt-1 max-w-xs mx-auto">
                            {isSignUp ? t('auth.signUpSubtitle') : t('auth.subtitle')}
                        </p>
                    </div>

                    {/* Error Notification */}
                    {error && (
                        <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 px-5 py-3 text-xs sm:text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-base shrink-0">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form Container */}
                    <div className="p-6 sm:p-8 flex flex-col gap-4">
                        {/* Google OAuth Button with Crisp Inline SVG */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full bg-white dark:bg-[#1f1a0e] hover:bg-slate-50 dark:hover:bg-[#2d2514] text-slate-800 dark:text-[#f4c025] font-semibold py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 dark:border-[#493f22] transition-all shadow-sm flex items-center justify-center gap-3 text-sm active:scale-[0.99] disabled:opacity-60"
                        >
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.27 7.31 24 12 24z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.005 10.04.005 12c0 1.96.455 3.8 1.265 5.42l4.01-3.15z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.73 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                                />
                            </svg>
                            <span>{t('auth.googleSignIn')}</span>
                        </button>

                        {/* Divider */}
                        <div className="relative flex items-center py-1">
                            <div className="flex-grow border-t border-slate-200 dark:border-[#493f22]"></div>
                            <span className="flex-shrink-0 mx-3 text-slate-400 dark:text-[#cbbc90]/60 text-xs font-medium">
                                {t('auth.orEmail')}
                            </span>
                            <div className="flex-grow border-t border-slate-200 dark:border-[#493f22]"></div>
                        </div>

                        {/* Standard Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                            {isSignUp && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-[#cbbc90]">
                                        {t('auth.fullName')}
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={t('auth.fullNamePlaceholder')}
                                        className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        required={isSignUp}
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-[#cbbc90]">
                                    {t('auth.email')}
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('auth.emailPlaceholder')}
                                    className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 dark:text-[#cbbc90]">
                                        {t('auth.password')}
                                    </label>
                                    {!isSignUp && (
                                        <a
                                            href="mailto:ahmadfikriraf@gmail.com?subject=Rupiku%20Account%20Support"
                                            className="text-xs font-semibold text-primary hover:underline"
                                            title="Contact Support"
                                        >
                                            {t('auth.forgotPassword')}
                                        </a>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t('auth.passwordPlaceholder')}
                                        className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-3.5 py-2.5 pr-11 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#cbbc90] p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>

                                {/* Password Strength Indicator during Sign Up */}
                                {isSignUp && password.length > 0 && (
                                    <div className="mt-1 flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 h-1.5 w-full">
                                            <div
                                                className={`h-full flex-1 rounded-full transition-colors ${
                                                    passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200 dark:bg-[#342e1b]'
                                                }`}
                                            />
                                            <div
                                                className={`h-full flex-1 rounded-full transition-colors ${
                                                    passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200 dark:bg-[#342e1b]'
                                                }`}
                                            />
                                            <div
                                                className={`h-full flex-1 rounded-full transition-colors ${
                                                    passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200 dark:bg-[#342e1b]'
                                                }`}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-[#cbbc90]/70">
                                            <span>{t('auth.passwordHint')}</span>
                                            <span className="font-semibold">{passwordStrength.text}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary-hover text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2 text-sm"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></span>
                                        <span>{isSignUp ? t('auth.creatingAccount') : t('auth.signingIn')}</span>
                                    </>
                                ) : (
                                    <span>{isSignUp ? t('auth.signUpBtn') : t('auth.signInBtn')}</span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Accessible Footer Toggle */}
                    <div className="px-6 py-4 bg-slate-50/80 dark:bg-[#1e1a0e] text-center border-t border-slate-100 dark:border-[#493f22]">
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#cbbc90]">
                            {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="font-bold text-primary hover:underline ml-1.5 focus:outline-none focus:ring-1 focus:ring-primary rounded"
                            >
                                {isSignUp ? t('auth.signInLink') : t('auth.signUpLink')}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Sub-note */}
                <p className="mt-4 text-xs text-slate-400 dark:text-[#cbbc90]/50 text-center max-w-sm">
                    {t('auth.securityNotice')}
                </p>
            </div>

            {/* Install Prompt Support */}
            <InstallPrompt />
        </>
    );
};

export default Login;
