import axios from 'axios';

// Get base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const getPortfolioData = async () => {
    try {
        const response = await api.get('/users/portfolio');
        // The backend returns { success: true, clientCode: '...', data: [...] }
        return response.data;
    } catch (error) {
        console.error('Error fetching portfolio data:', error);
        throw error;
    }
};
