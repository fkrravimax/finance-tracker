import axios from 'axios';

// Create Axios Instance
// Create Axios Instance
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
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
