import React, { useEffect } from 'react';
import { authService } from '../services/authService';
import api from '../services/api';

const STORAGE_KEY_FIX_V1 = 'finance_fix_multi_account_v1';

const SessionVerifier: React.FC = () => {
    useEffect(() => {
        const verifySession = async () => {
            // 1. One-time nuclear cleanup for this fix
            // This is necessary because previous bad tokens might still be in localStorage
            if (!localStorage.getItem(STORAGE_KEY_FIX_V1)) {
                console.log("Applying Multi-Account Fix V1: Clearing old sessions");
                localStorage.removeItem('finance_sessions');
                localStorage.removeItem('finance_active_user_id');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.setItem(STORAGE_KEY_FIX_V1, 'true');
                window.location.href = '/login';
                return;
            }

            const activeUser = authService.getCurrentUser();
            if (!activeUser) return;

            try {
                // Fetch valid session from server using the current token
                // better-auth endpoint for session
                const { data } = await api.get('/auth/session');

                if (data && data.user) {
                    if (data.user.id !== activeUser.id) {
                        console.error("Session Mismatch Detected! Local:", activeUser.id, "Server:", data.user.id);
                        // The token we are sending belongs to someone else!
                        // Force logout/cleanup
                        await authService.logout();
                    } else {
                        console.log("Session Verified: Token matches User", activeUser.name);
                    }
                } else {
                    // Session invalid or expired
                    console.warn("Session invalid on server");
                    if (authService.isAuthenticated()) {
                        // Optional: Force logout if server says invalid?
                        // await authService.logout(); 
                    }
                }
            } catch (error) {
                console.error("Session verification failed", error);
                // If 401, the interceptor handles it.
            }
        };

        if (authService.isAuthenticated()) {
            verifySession();
        }
    }, []);

    return null;
};

export default SessionVerifier;
