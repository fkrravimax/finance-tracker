import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { authClient } from '../lib/auth-client';
import { useAppearance } from '../contexts/AppearanceContext';

interface LoginProps {
    onLogin: () => void;
    onBack?: () => void;
    defaultSignUp?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack, defaultSignUp = false }) => {
    const [isSignUp, setIsSignUp] = useState(defaultSignUp);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: window.location.origin + "/dashboard" // Handle via proper absolute URL
            });
            // Note: Better Auth social sign in usually redirects. 
            // If it redirects, this code might not run until return.
        } catch (err: any) {
            console.error("Google auth failed", err);
            setError("Google authentication failed");
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError(null);
        setEmail('');
        setPassword('');
        setName('');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark p-4 font-display">
            <div className="w-full max-w-md bg-white dark:bg-[#2a2515] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-[#493f22]">
                {/* Header */}
                <div className="bg-surface-light dark:bg-[#342d18] p-8 text-center border-b border-slate-100 dark:border-[#493f22] relative">
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

                    <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
                        <img src="/logo.png" alt="FinTrack Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">FinTrack</h1>
                    <p className="text-slate-500 dark:text-[#cbbc90] mt-2">
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
                <div className="p-8 flex flex-col gap-5">

                    {/* Google Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full bg-white dark:bg-[#1f1b10] hover:bg-slate-50 dark:hover:bg-[#342d18] text-slate-700 dark:text-[#cbbc90] font-bold py-3 rounded-xl border border-slate-200 dark:border-[#493f22] transition-all flex items-center justify-center gap-3"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                        {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-200 dark:border-[#493f22]"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Or with email</span>
                        <div className="flex-grow border-t border-slate-200 dark:border-[#493f22]"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {isSignUp && (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    required={isSignUp}
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-[#dca60e] text-slate-900 font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/25 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
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
                <div className="p-6 bg-slate-50 dark:bg-[#1f1b10] text-center border-t border-slate-100 dark:border-[#493f22]">
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
    );
};

export default Login;
