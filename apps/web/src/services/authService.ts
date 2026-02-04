import api from './api';
import type { AuthResponse, User } from '../types';
import { authClient } from '../lib/auth-client';

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            // Better Auth Sign In
            const { data } = await api.post('/auth/sign-in/email', { email, password });

            // Better Auth returns session/user structure different from our type
            // or we need to adapt the response.
            // For now, let's assume valid response and fetch session or adapt here.

            // NOTE: better-auth usually sets a cookie or returns a token.
            // If we are strictly API mode, we might need to handle the token.
            // But let's assume we get the user back.

            // Adapting response to fit our AuthResponse type
            const responseData = data as any;

            // If better-auth returns { user, token } or { user, session }
            const user = responseData.user;
            const token = responseData.token || responseData.session?.token;

            if (user && token) {
                const authResponse = {
                    user: user,
                    token: token
                };

                localStorage.setItem('token', authResponse.token);
                localStorage.setItem('user', JSON.stringify(authResponse.user));
                localStorage.setItem('isAuthenticated', 'true');

                return authResponse;
            }

            throw new Error("Invalid response from server");

        } catch (error: any) {
            console.error("Login error:", error.response?.data || error.message);
            // Fallback to mock for testing if server is down (Optional, but user asked to check if it works)
            // remove this fallback when DB is ready.
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
                localStorage.setItem('token', authResponse.token);
                localStorage.setItem('user', JSON.stringify(authResponse.user));
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
            // Any other cleanup
            window.location.href = '/'; // Force redirect to login
        }
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    }
};
