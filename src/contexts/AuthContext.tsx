import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getAuthService, getGraphService } from '../services/serviceFactory';
import { User, isUserManager, MANAGER_GROUP_ID } from '../types/User';
import { isTestMode } from '../config/testModeConfig';

// Get services from factory (will be mock services in test mode)
const authService = getAuthService();
const graphService = getGraphService();

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isManager: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: (scopes: string[]) => Promise<string>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile with group memberships
  const loadUserWithGroups = async (): Promise<User | null> => {
    const profile = await authService.getUserProfile();
    if (!profile) return null;

    // Try to load group memberships if manager group is configured
    let groupMemberships: string[] = [];
    if (MANAGER_GROUP_ID) {
      try {
        groupMemberships = await graphService.getUserGroupMemberships();
      } catch (err) {
        console.warn('Failed to load group memberships, using email fallback:', err);
      }
    }

    const isManagerResult = isUserManager(profile.email, groupMemberships);
    console.log('[AuthContext] User profile loaded:', {
      email: profile.email,
      displayName: profile.displayName,
      groupMemberships,
      isManager: isManagerResult,
    });

    return {
      ...profile,
      groupMemberships,
      isManager: isManagerResult,
    };
  };

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      if (isTestMode) {
        console.log('[AuthContext] Initializing in TEST MODE');
      }
      await authService.initialize();
      if (authService.isAuthenticated()) {
        const userWithGroups = await loadUserWithGroups();
        setUser(userWithGroups);
        if (isTestMode) {
          console.log('[AuthContext] Test user loaded:', userWithGroups?.displayName);
        }
      }
    } catch (err) {
      setError('Failed to initialize authentication');
      console.error('Auth initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.login();
      const userWithGroups = await loadUserWithGroups();
      setUser(userWithGroups);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError('Logout failed');
      throw err;
    }
  }, []);

  const getToken = useCallback(async (scopes: string[]) => {
    return authService.getToken(scopes);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Compute isManager from user object
  const isManagerValue = user ? isUserManager(user.email, user.groupMemberships) : false;

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    isManager: isManagerValue,
    login,
    logout,
    getToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
