import axios from 'axios';
import { mockEquityHoldings } from '@/utils/mockData';

const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

// Get base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 5000, // 5 seconds timeout
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

export const getPortfolioData = async (clientCode?: string) => {
    if (USE_LOCAL_AUTH) {
        console.log('🔓 PortfolioService: Using mock portfolio data');
        return {
            success: true,
            clientCode: clientCode || 'MOCK_USER',
            data: mockEquityHoldings
        };
    }
    try {
        const url = clientCode ? `/users/portfolio?clientCode=${clientCode}` : '/users/portfolio';
        const response = await api.get(url);
        // The backend returns { success: true, clientCode: '...', data: [...] }
        return response.data;
    } catch (error) {
        console.error('Error fetching portfolio data:', error);
        throw error;
    }
};

export const refreshPortfolioData = async (clientCode?: string) => {
    try {
        const url = clientCode ? `/users/portfolio/refresh?clientCode=${clientCode}` : '/users/portfolio/refresh';
        const response = await api.post(url, {}, { timeout: 30000 }); // 30 second timeout for refresh
        return response.data;
    } catch (error) {
        console.error('Error refreshing portfolio data:', error);
        throw error;
    }
};

export const getLedgerData = async (clientCode?: string, financialYear?: string) => {
    try {
        let url = '/users/ledger';
        const params = new URLSearchParams();
        if (clientCode) params.append('clientCode', clientCode);
        if (financialYear) params.append('financialYear', financialYear);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching ledger data:', error);
        throw error;
    }
};
