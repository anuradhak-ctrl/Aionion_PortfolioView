import apiClient from '../lib/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

console.log('🔧 Auth Config:', {
  VITE_USE_LOCAL_AUTH: import.meta.env.VITE_USE_LOCAL_AUTH,
  USE_LOCAL_AUTH,
  API_BASE_URL
});

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  token?: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    name?: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  name?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const endpoint = USE_LOCAL_AUTH ? '/api/local-auth/login' : '/api/auth/login';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();

      // Handle both formats: { accessToken } and { token }
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken || data.token;

      // Store tokens and user data
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (data.idToken) {
        localStorage.setItem('idToken', data.idToken);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return { ...data, accessToken, refreshToken };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    const endpoint = USE_LOCAL_AUTH ? '/api/local-auth/logout' : '/api/auth/logout';

    try {
      await apiClient.post(endpoint);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }

      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export default new AuthService();
