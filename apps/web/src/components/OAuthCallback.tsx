import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

interface OAuthCallbackProps {
    onLogin: () => void;
}

const OAuthCallback: React.FC<OAuthCallbackProps> = ({ onLogin }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError(`Google authentication failed: ${errorParam}`);
            setTimeout(() => navigate('/login', { replace: true }), 3000);
            return;
        }

        if (code) {
            // Exchange short-lived code for session token via secure POST request
            api.post('/auth/google/exchange', { code })
                .then(({ data }) => {
                    const { token, user } = data;

                    // Store session and user data in localStorage
                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(user));

                    // Trigger login and navigate to dashboard
                    onLogin();
                    navigate('/dashboard', { replace: true });
                })
                .catch((err) => {
                    console.error('Failed to exchange auth code:', err);
                    setError('Failed to complete authentication');
                    setTimeout(() => navigate('/login', { replace: true }), 3000);
                });
        } else {
            setError('Missing authentication data');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
    }, [searchParams, navigate, onLogin]);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                    <p className="text-red-500 font-bold">{error}</p>
                    <p className="text-slate-500 text-sm mt-2">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="text-center">
                <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin inline-block"></span>
                <p className="text-slate-600 dark:text-slate-300 mt-4 font-medium">Completing sign in...</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
