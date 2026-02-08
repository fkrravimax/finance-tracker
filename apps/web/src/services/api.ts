import axios from 'axios';

// Create Axios Instance
// Create Axios Instance
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        // Direct read to avoid circular dependency and sync issues with authService
        const activeUserId = localStorage.getItem('finance_active_user_id');
        const sessionsStr = localStorage.getItem('finance_sessions');

        let token: string | null = null;

        if (activeUserId && sessionsStr) {
            try {
                const sessions = JSON.parse(sessionsStr);
                if (sessions[activeUserId]) {
                    token = sessions[activeUserId].token;
                }
            } catch (e) {
                console.error("Failed to parse sessions in api interceptor", e);
            }
        }

        // Fallback to legacy if not found
        if (!token) {
            token = localStorage.getItem('token');
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Errors (e.g., 401 Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthenticated - Clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('isAuthenticated');
            // We might want to trigger a global event or redirect here
            // window.location.href = '/'; 
            // For now, let the app handle the state change naturally via AuthContext/Service
        }
        return Promise.reject(error);
    }
);

export default api;
