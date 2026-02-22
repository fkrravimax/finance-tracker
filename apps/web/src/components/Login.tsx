import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useAppearance } from '../contexts/AppearanceContext';
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

    // Set initial sign up mode from props
    useEffect(() => {
        setIsSignUp(defaultSignUp);
    }, [defaultSignUp]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (isSignUp) {
                await authService.register(name, email, password);
                // After register, usually auto-login or ask to login. 
                // authService.register returns AuthResponse with token/user, so it's a login.
                onLogin();
            } else {
                await authService.login(email, password);
                onLogin();
            }
        } catch (err: any) {
            console.error("Auth failed", err);
            setError(err.message || (isSignUp ? 'Registration failed' : 'Login failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        setIsLoading(true);
        setError(null);
        // Redirect to our manual Google OAuth endpoint (bypasses Better Auth cookies)
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
            <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center font-display relative overflow-y-auto overflow-x-hidden pt-8 pb-16 px-4 md:px-0">
                {/* Background Image & Overlay */}
                <div className="fixed inset-0 z-0">
                    <img src="/bg.png" alt="Background" className="w-full h-full object-cover object-center opacity-50 dark:opacity-40" />
                    <div className="absolute inset-0 bg-background-light/45 dark:bg-background-dark/60 backdrop-blur-sm"></div>
                </div>

                <div className="w-full max-w-sm md:max-w-md bg-white dark:bg-[#2a2515] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-[#493f22] relative z-10 my-auto mb-16 md:mb-auto mt-auto md:mt-auto shrink-0">
                    {/* Header */}
                    <div className="bg-surface-light dark:bg-[#342d18] p-5 md:p-8 text-center border-b border-slate-100 dark:border-[#493f22] relative">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-[#2a2515] transition-all"
                                title="Back to Landing"
                            >
                                <span className="material-symbols-outlined text-xl">arrow_back</span>
                            </button>
                        )}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-[#2a2515] transition-all"
                            title="Toggle Theme"
                        >
                            <span className="material-symbols-outlined text-xl">
                                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>

                        <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 mb-2 md:mb-4">
                            <img src="/logo.png" alt="Rupiku Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="mb-0 md:mb-1">
                            <LogoText className="text-2xl md:text-3xl" />
                        </div>
                        <p className="hidden md:block text-sm text-slate-500 dark:text-[#cbbc90]">Joyful Finance Tracker</p>
                        <p className="text-slate-500 dark:text-[#cbbc90] mt-1 md:mt-2 text-sm md:text-base">
                            {isSignUp ? 'Create an account to get started' : 'Welcome back! Please sign in.'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <div className="p-5 md:p-8 flex flex-col gap-3 md:gap-5">

                        {/* Google Button */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full bg-white dark:bg-[#1f1b10] hover:bg-slate-50 dark:hover:bg-[#342d18] text-slate-700 dark:text-[#cbbc90] font-bold py-2 md:py-3 rounded-xl border border-slate-200 dark:border-[#493f22] transition-all flex items-center justify-center gap-3"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                            {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
                        </button>

                        <div className="relative flex items-center py-1 md:py-2">
                            <div className="flex-grow border-t border-slate-200 dark:border-[#493f22]"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Or with email</span>
                            <div className="flex-grow border-t border-slate-200 dark:border-[#493f22]"></div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {isSignUp && (
                                <div className="flex flex-col gap-1.5 md:gap-2">
                                    <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 md:py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        required={isSignUp}
                                    />
                                </div>
                            )}
                            <div className="flex flex-col gap-1.5 md:gap-2">
                                <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 md:py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 md:gap-2">
                                <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 md:py-3 pr-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#cbbc90] p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                        tabIndex={-1}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-[#dca60e] text-slate-900 font-bold py-3 md:py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/25 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-1 md:mt-2 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                                        {isSignUp ? 'Creating account...' : 'Signing in...'}
                                    </>
                                ) : (
                                    isSignUp ? 'Create Account' : 'Sign In'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-4 md:p-6 bg-slate-50 dark:bg-[#1f1b10] text-center border-t border-slate-100 dark:border-[#493f22]">
                        <p className="text-sm text-slate-500 dark:text-[#cbbc90]">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                            <span
                                onClick={toggleMode}
                                className="font-bold text-primary cursor-pointer hover:underline ml-1"
                            >
                                {isSignUp ? 'Sign in' : 'Sign up'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
            {/* Add Install Prompt to Auth Page */}
            <InstallPrompt />
        </>
    );
};

export default Login;
