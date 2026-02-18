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
        <div className="h-screen w-full font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white relative overflow-hidden">
            {/* Fixed Background - stays static */}
            <div className="absolute inset-0 z-0">
                <img src="/bg.png" alt="Background" className="w-full h-full object-cover object-center opacity-50 dark:opacity-40" />
                <div className="absolute inset-0 bg-background-light/45 dark:bg-background-dark/80 backdrop-blur-[2px]"></div>
            </div>

            {/* Scrollable Content Container - handling the scroll */}
            <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden flex flex-col">
                <LandingHeader />

                <main className="flex-1 flex flex-col w-full">
                    {/* Hero Section */}
                    <div className="w-full min-h-[90vh] flex items-center justify-center pt-20 pb-12 shrink-0">
                        <LandingHero onSignUp={onSignUp} />
                    </div>

                    {/* Features Section */}
                    <section className="w-full py-12 md:py-24 relative shrink-0">
                        <LandingFeatures onSignUp={onSignUp} />
                    </section>

                    {/* How It Works Section */}
                    <section className="w-full relative shrink-0">
                        {/* Faded Background Layer */}
                        <div className="absolute inset-0 bg-white/50 dark:bg-[#2b2616]/30 backdrop-blur-sm [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_60%,transparent)] z-0 pointer-events-none"></div>

                        <div className="relative z-10 py-12 md:py-24">
                            <LandingHowItWorks />
                        </div>
                    </section>

                    {/* CTA Section - Overlapping Start */}
                    <div className="shrink-0 -mt-24 pt-24 relative z-10 pointer-events-none">
                        <div className="pointer-events-auto">
                            <LandingCTA onSignUp={onSignUp} />
                        </div>
                    </div>
                </main>

                <div className="shrink-0">
                    <LandingFooter onSignIn={onSignIn} />
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
