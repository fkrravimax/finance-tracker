import React from 'react';
import LandingHeader from './landing/LandingHeader';
import LandingHero from './landing/LandingHero';
import LandingFeatures from './landing/LandingFeatures';
import LandingHowItWorks from './landing/LandingHowItWorks';
import LandingCTA from './landing/LandingCTA';
import LandingFooter from './landing/LandingFooter';

interface LandingPageProps {
    onSignUp: () => void;
    onSignIn: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignUp, onSignIn }) => {
    return (
        <div className="h-screen w-full font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white relative overflow-hidden select-none sm:select-auto">
            {/* High-Performance Ambient Background (Pure CSS, 0 Bandwidth) */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Primary Ambient Glow */}
                <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px]" />
                {/* Secondary Accent Glow */}
                <div className="absolute top-[40%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-amber-500/10 dark:bg-[#f4c025]/5 blur-[140px]" />
                {/* Bottom Center Depth Glow */}
                <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-sky-500/5 dark:bg-amber-600/5 blur-[160px]" />

                {/* Subtle Geometric Dot Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.4] dark:opacity-[0.18]"
                    style={{
                        backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
                        backgroundSize: '28px 28px',
                        color: 'var(--color-primary-val)',
                    }}
                />
            </div>

            {/* Scrollable Content Container */}
            <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden flex flex-col scroll-smooth">
                <LandingHeader onSignIn={onSignIn} onSignUp={onSignUp} />

                <main className="flex-1 flex flex-col w-full">
                    {/* Hero Section */}
                    <div className="w-full flex items-center justify-center pt-4 pb-8 shrink-0">
                        <LandingHero onSignUp={onSignUp} onSignIn={onSignIn} />
                    </div>

                    {/* Features Section */}
                    <div className="w-full shrink-0">
                        <LandingFeatures onSignUp={onSignUp} />
                    </div>

                    {/* How It Works Section */}
                    <div className="w-full shrink-0 relative">
                        <div className="absolute inset-0 bg-slate-100/40 dark:bg-[#252012]/40 backdrop-blur-[1px] -z-10" />
                        <LandingHowItWorks />
                    </div>

                    {/* Final CTA Section */}
                    <div className="w-full shrink-0">
                        <LandingCTA onSignUp={onSignUp} />
                    </div>
                </main>

                <LandingFooter onSignIn={onSignIn} />
            </div>
        </div>
    );
};

export default LandingPage;
