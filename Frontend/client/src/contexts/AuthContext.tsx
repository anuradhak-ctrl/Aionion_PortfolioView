import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User, LoginCredentials } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateAndRestoreAuth = async () => {
      // Check if user is already logged in
      const currentUser = authService.getCurrentUser();
      const token = authService.getAccessToken();

      if (currentUser && token) {
        try {
          console.log('🔍 Validating stored token...');
          // Check if token is expired by decoding JWT
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('📦 Token payload:', payload);

            if (!payload.exp) {
              console.warn('⚠️ Token has no expiration field, treating as valid');
              setUser(currentUser);
              setIsLoading(false);
              return;
            }

            const expiration = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const timeUntilExpiry = expiration - now;

            console.log('⏰ Token expires at:', new Date(expiration).toLocaleString());
            console.log('⏰ Time until expiry:', Math.round(timeUntilExpiry / 1000 / 60), 'minutes');

            if (now >= expiration) {
              console.warn('⚠️ Token expired, clearing auth state');
              await authService.logout();
              setUser(null);
              setIsLoading(false);
              return;
            }
          }

          // Token not expired, restore user
          console.log('✅ Token valid, restoring user');
          setUser(currentUser);
        } catch (error) {
          // Token parsing error, clear auth
          console.error('❌ Auth validation error:', error);
          await authService.logout();
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    validateAndRestoreAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      console.log('🔍 Login response user:', response.user);
      if (response.user) {
        setUser(response.user);
        // Wait for next tick to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
