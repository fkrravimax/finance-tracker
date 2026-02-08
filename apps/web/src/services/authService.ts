import api from './api';
import type { AuthResponse, User } from '../types';
import { authClient } from '../lib/auth-client';

export const authService = {
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
                localStorage.setItem('token', token);
                // Also store user info if needed
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('isAuthenticated', 'true'); // Helper

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
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('isAuthenticated', 'true');

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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');

            // Cleanup multi-account leftovers just in case
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

    getToken: (): string | null => {
        return localStorage.getItem('token');
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    },

    // Include other necessary methods if they were used elsewhere
    // In multi-account version we had getAccounts, switchAccount, getActiveUserId - remove these. 

    fetchWithAuth: async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('token');
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
