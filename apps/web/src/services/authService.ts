import api from './api';
import type { AuthResponse, User } from '../types';
import { authClient } from '../lib/auth-client';

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            // Better Auth Sign In — session is managed via httpOnly cookies
            const { data } = await api.post('/auth/sign-in/email', { email, password });

            const responseData = data as any;
            const user = responseData.user;
            const token = responseData.token || responseData.session?.token;

            if (user) {
                const authResponse = {
                    user: user,
                    token: token || ''
                };
                // Store only non-sensitive user display data (name, email, etc.)
                // Auth session is managed via httpOnly cookies — NOT localStorage
                localStorage.setItem('user', JSON.stringify(user));

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

            if (user) {
                const authResponse = {
                    user: user,
                    token: token || ''
                };
                // Store only non-sensitive user display data
                localStorage.setItem('user', JSON.stringify(user));

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
            // Clean up all localStorage data (backward compat + user data)
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('finance_sessions');
            localStorage.removeItem('finance_active_user_id');

            window.location.href = '/login';
        }
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    },

    isAuthenticated: (): boolean => {
        // Check if user data exists — actual session validity is verified by
        // the server via httpOnly cookies on every API request
        return !!localStorage.getItem('user');
    },

    // Cookie-based fetch helper — also supports Bearer token for manual OAuth sessions
    fetchWithAuth: async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        // Add Bearer token if available (manual Google OAuth sessions)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`, {
            ...options,
            headers,
            credentials: 'include', // Send cookies for auth
        });

        if (response.status === 401) {
            // Only logout if we have no valid token at all
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Request failed');
        }

        return response;
    }
};
