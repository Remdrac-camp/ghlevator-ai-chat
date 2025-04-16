
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, ApiKeys } from '../types';

interface AuthContextType {
  authState: AuthState;
  apiKeys: ApiKeys;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateApiKeys: (keys: Partial<ApiKeys>) => void;
  isApiConfigured: () => boolean;
}

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true
};

const initialApiKeys: ApiKeys = {
  openai: '',
  goHighLevel: ''
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(initialApiKeys);

  // Load auth state from localStorage on init
  useEffect(() => {
    const loadAuthState = () => {
      const savedUser = localStorage.getItem('user');
      const savedKeys = localStorage.getItem('apiKeys');

      if (savedUser) {
        setAuthState({
          user: JSON.parse(savedUser),
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        setAuthState({
          ...authState,
          isLoading: false
        });
      }

      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
    };

    loadAuthState();
  }, []);

  const login = async (email: string, password: string) => {
    // In a real app, this would call an API
    // For demo, we'll just simulate a successful login
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0]
    };

    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    setAuthState({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false
    });
  };

  const logout = () => {
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const updateApiKeys = (keys: Partial<ApiKeys>) => {
    const updatedKeys = { ...apiKeys, ...keys };
    localStorage.setItem('apiKeys', JSON.stringify(updatedKeys));
    setApiKeys(updatedKeys);
  };

  const isApiConfigured = () => {
    return !!apiKeys.openai && !!apiKeys.goHighLevel;
  };

  const value = {
    authState,
    apiKeys,
    login,
    logout,
    updateApiKeys,
    isApiConfigured
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
