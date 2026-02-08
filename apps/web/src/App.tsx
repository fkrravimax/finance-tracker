import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import Dashboard from './components/Dashboard'
import Reports from './components/Reports'
import SavingsVault from './components/SavingsVault'
import Transactions from './components/Transactions'
import Settings from './components/Settings'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import TradingDashboard from './components/TradingDashboard'
import AdminDashboard from './components/AdminDashboard'
import { authService } from './services/authService'
import { authClient } from './lib/auth-client';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [showAuth, setShowAuth] = useState(false);
    const [isSignUpMode, setIsSignUpMode] = useState(false);

    // Check for saved auth session
    useEffect(() => {
        const checkAuth = async () => {
            // Check localStorage first for speed
            if (authService.isAuthenticated()) {
                setIsAuthenticated(true);
                setIsAuthChecking(false);
                return;
            }

            // If strictly relying on Better Auth cookies (OAuth), check session
            try {
                const session = await authClient.getSession();
                if (session.data) {
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Auth check failed", error);
            } finally {
                setIsAuthChecking(false);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
        setShowAuth(false);
    };

    const handleLogout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setShowAuth(false);
    };

    if (isAuthChecking) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
            </div>
        );
    }

    // Show Landing Page first if not authenticated and not in auth mode
    if (!isAuthenticated && !showAuth) {
        return (
            <LandingPage
                onSignUp={() => { setIsSignUpMode(true); setShowAuth(true); }}
                onSignIn={() => { setIsSignUpMode(false); setShowAuth(true); }}
            />
        );
    }

    // Show Login/SignUp page
    if (!isAuthenticated && showAuth) {
        return (
            <Login
                onLogin={handleLogin}
                onBack={() => setShowAuth(false)}
                defaultSignUp={isSignUpMode}
            />
        );
    }


    return (
        <DashboardLayout onLogout={handleLogout}>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/savings" element={<SavingsVault />} />
                <Route path="/trading" element={<TradingDashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-[#cbbc90]">
                        <span className="material-symbols-outlined text-6xl mb-4">construction</span>
                        <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                        <p>This page is currently under construction.</p>
                    </div>
                } />
            </Routes>
        </DashboardLayout>
    )
}

export default App
