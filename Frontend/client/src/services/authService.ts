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
  userType?: 'client' | 'internal';
}

export interface AuthResponse {
  success?: boolean;
  status?: 'SUCCESS' | 'MFA_SETUP' | 'MFA_REQUIRED' | 'NEW_PASSWORD_REQUIRED';
  message?: string;
  session?: string;
  username?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  token?: string;
  tokens?: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
  };
  user?: {
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

export interface MFASetupResponse {
  success: boolean;
  secretCode: string;
  qrCode: string; // Base64 data URL
  session: string;
  message: string;
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

      const data: AuthResponse = await response.json();

      // Handle different statuses
      if (data.status === 'SUCCESS') {
        this.handleSuccessfulAuth(data);
        return data;
      } else if (data.status === 'MFA_SETUP') {
        // Save session for MFA setup
        sessionStorage.setItem('authSession', data.session!);
        sessionStorage.setItem('authUsername', data.username!);
        return data;
      } else if (data.status === 'MFA_REQUIRED') {
        // Save session for MFA verification
        sessionStorage.setItem('authSession', data.session!);
        sessionStorage.setItem('authUsername', data.username!);
        return data;
      } else if (data.status === 'NEW_PASSWORD_REQUIRED') {
        // Save session for password change
        sessionStorage.setItem('authSession', data.session!);
        sessionStorage.setItem('authUsername', data.username!);
        return data;
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async setupMFA(): Promise<MFASetupResponse> {
    const session = sessionStorage.getItem('authSession');
    const username = sessionStorage.getItem('authUsername');

    if (!session || !username) {
      throw new Error('No active session for MFA setup');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/mfa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session, username }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate MFA secret');
      }

      const data = await response.json();

      // Update session token
      if (data.session) {
        sessionStorage.setItem('authSession', data.session);
      }

      return data;
    } catch (error) {
      console.error('MFA setup error:', error);
      throw error;
    }
  }

  async verifyMFASetup(code: string): Promise<AuthResponse> {
    const session = sessionStorage.getItem('authSession');
    const username = sessionStorage.getItem('authUsername');

    if (!session || !username) {
      throw new Error('No active session for MFA verification');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/mfa/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session, username, code }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Invalid MFA code' }));
        throw new Error(error.message || 'Invalid MFA code');
      }

      const data = await response.json();

      // Clear session storage after successful setup
      sessionStorage.removeItem('authSession');
      sessionStorage.removeItem('authUsername');

      return data;
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  }

  async verifyMFAChallenge(code: string, userType: 'client' | 'internal' = 'client'): Promise<AuthResponse> {
    const session = sessionStorage.getItem('authSession');
    const username = sessionStorage.getItem('authUsername');

    if (!session || !username) {
      throw new Error('No active session for MFA verification');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session, username, code, userType }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Invalid MFA code' }));
        throw new Error(error.message || 'Invalid MFA code');
      }

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        this.handleSuccessfulAuth(data);
        // Clear session storage
        sessionStorage.removeItem('authSession');
        sessionStorage.removeItem('authUsername');
      }

      return data;
    } catch (error) {
      console.error('MFA challenge error:', error);
      throw error;
    }
  }

  async changePassword(newPassword: string, userType: 'client' | 'internal' = 'client'): Promise<AuthResponse> {
    const session = sessionStorage.getItem('authSession');
    const username = sessionStorage.getItem('authUsername');

    if (!session || !username) {
      throw new Error('No active session for password change');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/password/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session, username, newPassword, userType }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Password change failed' }));
        throw new Error(error.message || 'Password change failed');
      }

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        this.handleSuccessfulAuth(data);
        // Clear session storage
        sessionStorage.removeItem('authSession');
        sessionStorage.removeItem('authUsername');
      } else if (data.status === 'MFA_SETUP') {
        // Password changed, now need MFA setup
        sessionStorage.setItem('authSession', data.session!);
      }

      return data;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  private handleSuccessfulAuth(data: AuthResponse) {
    const tokens = data.tokens || {
      idToken: data.idToken!,
      accessToken: data.accessToken || data.token!,
      refreshToken: data.refreshToken || data.token!
    };

    if (tokens.accessToken) {
      localStorage.setItem('accessToken', tokens.accessToken);
    }
    if (tokens.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    if (tokens.idToken) {
      localStorage.setItem('idToken', tokens.idToken);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  }

  async logout(): Promise<void> {
    const endpoint = USE_LOCAL_AUTH ? '/api/local-auth/logout' : '/api/auth/logout';

    try {
      await apiClient.post(endpoint);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear ALL storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authSession');
      sessionStorage.removeItem('authUsername');
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

      if (data.tokens?.accessToken) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        return { accessToken: data.tokens.accessToken };
      } else if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        return { accessToken: data.accessToken };
      }

      throw new Error('No access token in refresh response');
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
