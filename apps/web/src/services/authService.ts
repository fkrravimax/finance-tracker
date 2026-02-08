import api from './api';
import type { AuthResponse, User } from '../types';
import { authClient } from '../lib/auth-client';

const STORAGE_KEY_SESSIONS = 'finance_sessions';
const STORAGE_KEY_ACTIVE_USER = 'finance_active_user_id';

// Helper types for internal storage
interface SessionData {
    token: string;
    user: User;
    lastActive: number;
}

interface SessionMap {
    [userId: string]: SessionData;
}

export const authService = {
    // Migrate legacy single-user storage to multi-user storage
    migrateFromLegacyStorage: () => {
        const legacyToken = localStorage.getItem('token');
        const legacyUserStr = localStorage.getItem('user');

        // Only migrate if we have legacy data AND no new data
        if (legacyToken && legacyUserStr && !localStorage.getItem(STORAGE_KEY_SESSIONS)) {
            try {
                const user = JSON.parse(legacyUserStr);
                const sessions: SessionMap = {
                    [user.id]: {
                        token: legacyToken,
                        user: user,
                        lastActive: Date.now()
                    }
                };
                localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
                localStorage.setItem(STORAGE_KEY_ACTIVE_USER, user.id);

                // Cleanup legacy keys to avoid confusion, 
                // BUT current api.ts reads 'token' directly. 
                // We must update api.ts OR keep 'token' in sync with active user.
                // Approach: Keep 'token' and 'user' sync'd with active session for backward compatibility.
            } catch (e) {
                console.error("Migration failed", e);
            }
        }
    },

    // Sync active session to legacy keys for compatibility with api.ts and other consumers
    syncLegacyKeys: () => {
        const activeUser = authService.getCurrentUser();
        const activeToken = authService.getToken();

        if (activeUser && activeToken) {
            localStorage.setItem('token', activeToken);
            localStorage.setItem('user', JSON.stringify(activeUser));
            localStorage.setItem('isAuthenticated', 'true');
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
        }
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            // Better Auth Sign In
            const { data } = await api.post('/auth/sign-in/email', { email, password });

            const responseData = data as any;
            const user = responseData.user;
            const token = responseData.token || responseData.session?.token;

            if (user && token) {
                const authResponse = {
                    user: user,
                    token: token
                };

                // 1. Get existing sessions
                const sessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);
                const sessions: SessionMap = sessionsStr ? JSON.parse(sessionsStr) : {};

                // 2. Add/Update this session
                sessions[user.id] = {
                    token: token,
                    user: user,
                    lastActive: Date.now()
                };

                // 3. Save active user
                localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
                localStorage.setItem(STORAGE_KEY_ACTIVE_USER, user.id);

                // 4. Sync legacy keys
                authService.syncLegacyKeys();

                return authResponse;
            }

            throw new Error("Invalid response from server");

        } catch (error: any) {
            console.error("Login error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
        try {
            const { data } = await api.post('/auth/sign-up/email', {
                email,
                password,
                name
            });

            const responseData = data as any;
            const user = responseData.user;
            const token = responseData.token || responseData.session?.token;

            if (user && token) {
                const authResponse = {
                    user: user,
                    token: token
                };

                // 1. Get existing sessions
                const sessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);
                const sessions: SessionMap = sessionsStr ? JSON.parse(sessionsStr) : {};

                // 2. Add/Update this session
                sessions[user.id] = {
                    token: token,
                    user: user,
                    lastActive: Date.now()
                };

                // 3. Save active user
                localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
                localStorage.setItem(STORAGE_KEY_ACTIVE_USER, user.id);

                // 4. Sync legacy keys
                authService.syncLegacyKeys();

                return authResponse;
            }
            throw new Error("Invalid response from server");

        } catch (error: any) {
            console.error("Register error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    },

    logout: async () => {
        try {
            await authClient.signOut();
        } catch (error) {
            console.error("Logout failed to clear better-auth session", error);
        } finally {
            const activeUserId = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
            const sessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);
            let sessions: SessionMap = sessionsStr ? JSON.parse(sessionsStr) : {};

            if (activeUserId && sessions[activeUserId]) {
                delete sessions[activeUserId];
            }

            const remainingUserIds = Object.keys(sessions);

            if (remainingUserIds.length > 0) {
                // Switch to the most recently active user
                // Sort by lastActive desc
                const nextUserId = remainingUserIds.sort((a, b) => sessions[b].lastActive - sessions[a].lastActive)[0];

                localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
                localStorage.setItem(STORAGE_KEY_ACTIVE_USER, nextUserId);
                authService.syncLegacyKeys();

                // Refresh to load new user data
                window.location.reload();
            } else {
                // No users left
                localStorage.removeItem(STORAGE_KEY_SESSIONS);
                localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
                authService.syncLegacyKeys(); // This will clear legacy keys
                window.location.href = '/';
            }
        }
    },

    switchAccount: (userId: string) => {
        const sessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);
        const sessions: SessionMap = sessionsStr ? JSON.parse(sessionsStr) : {};

        if (sessions[userId]) {
            // Update last active timestamp
            sessions[userId].lastActive = Date.now();
            localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));

            localStorage.setItem(STORAGE_KEY_ACTIVE_USER, userId);
            authService.syncLegacyKeys();
            window.location.reload();
        } else {
            console.error("Cannot switch to non-existent account");
        }
    },

    getAccounts: (): User[] => {
        const sessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);
        const sessions: SessionMap = sessionsStr ? JSON.parse(sessionsStr) : {};
        // Return users sorted by lastActive
        return Object.values(sessions)
            .sort((a, b) => b.lastActive - a.lastActive)
            .map(s => s.user);
    },

    getActiveUserId: (): string | null => {
        return localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    },

    getCurrentUser: (): User | null => {
        // First ensure migration runs if needed
        if (!localStorage.getItem(STORAGE_KEY_SESSIONS)) {
            authService.migrateFromLegacyStorage();
        }

        const activeUserId = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
        const sessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);

        if (activeUserId && sessionsStr) {
            const sessions: SessionMap = JSON.parse(sessionsStr);
            return sessions[activeUserId]?.user || null;
        }
        return null;
    },

    getToken: (): string | null => {
        const activeUserId = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
        const sessionsStr = localStorage.getItem(STORAGE_KEY_SESSIONS);

        if (activeUserId && sessionsStr) {
            const sessions: SessionMap = JSON.parse(sessionsStr);
            return sessions[activeUserId]?.token || null;
        }

        // Fallback to legacy if something went wrong
        return localStorage.getItem('token');
    },

    isAuthenticated: (): boolean => {
        return !!authService.getToken();
    },

    fetchWithAuth: async (url: string, options: RequestInit = {}) => {
        const token = authService.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Only logout the CURRENT active session
            authService.logout();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Request failed');
        }

        return response;
    }
};

// Auto-run migration when script loads (safe side effect)
authService.migrateFromLegacyStorage();
