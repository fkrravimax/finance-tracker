import axios from 'axios';

// Create Axios Instance
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    // Cookies are sent automatically with every request for auth
    withCredentials: true,
});

// Request Interceptor: Attach session token from localStorage as Bearer token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle auth errors (e.g., expired session)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Session expired or invalid — clean up local state
            localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export default api;
