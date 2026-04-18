import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import ErrorBoundary from './components/ErrorBoundary'
import OAuthCallback from './components/OAuthCallback'
import { authService } from './services/authService'
import { authClient } from './lib/auth-client';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded pages (code-split per route)
const Reports = lazy(() => import('./components/Reports'));
const SavingsVault = lazy(() => import('./components/SavingsVault'));
const Transactions = lazy(() => import('./components/Transactions'));
const Settings = lazy(() => import('./components/Settings'));
const TradingDashboard = lazy(() => import('./components/TradingDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const NotificationsPage = lazy(() => import('./components/NotificationsPage'));
const SplitBill = lazy(() => import('./components/SplitBill'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));

// Suspense fallback shared across all lazy routes
const PageLoader = () => (
    <div className="flex h-full items-center justify-center">
        <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
    </div>
);

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [showAuth, setShowAuth] = useState(false);
    const [isSignUpMode, setIsSignUpMode] = useState(false);

    // Check for saved auth session
    useEffect(() => {
        const checkAuth = async () => {
            // First, optimistically set authenticated if we have local data for fast initial sense of auth
            // but we still fetch the latest session from the server to get fresh roles/plans.
            const hasLocalAuth = authService.isAuthenticated();
            
            try {
                // Always check Better Auth cookie session to keep roles and user data fresh
                const session = await authClient.getSession();
                
                if (session.data) {
                    const user = session.data.user;
                    if (user) {
                        // Crucially, update local storage with fresh user data (roles, plans)
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                    setIsAuthenticated(true);
                } else if (!hasLocalAuth) {
                    // Fallback for non-cookie sessions (like old JWT if they exist)
                    setIsAuthenticated(false);
                } else {
                    // They had local auth but the server session is gone -> they are actually logged out
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Auth check failed", error);
                if (hasLocalAuth) {
                    // If offline or error, fallback to local storage
                    setIsAuthenticated(true);
                }
            } finally {
                setIsAuthChecking(false);
            }
        };
        checkAuth();

        // Register Service Worker for Push Notifications
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker registered', reg.scope))
                .catch(err => console.error('Service Worker registration failed:', err));
        }
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



    const location = useLocation();

    // Allow public access to Privacy Policy
    if (location.pathname === '/privacy') {
        return <Suspense fallback={<PageLoader />}><PrivacyPolicy /></Suspense>;
    }

    // Handle OAuth callback (public route)
    if (location.pathname === '/auth/callback') {
        return <OAuthCallback onLogin={handleLogin} />;
    }

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
        <ErrorBoundary>
            <DashboardLayout onLogout={handleLogout}>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/savings" element={<SavingsVault />} />
                        <Route path="/trading" element={<TradingDashboard />} />
                        <Route path="/split-bill" element={<SplitBill />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                            <Route path="/admin" element={<AdminDashboard />} />
                        </Route>
                        <Route path="*" element={
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-[#cbbc90]">
                                <span className="material-symbols-outlined text-6xl mb-4">construction</span>
                                <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                                <p>This page is currently under construction.</p>
                            </div>
                        } />
                    </Routes>
                </Suspense>
            </DashboardLayout>
        </ErrorBoundary>
    )
}

export default App
