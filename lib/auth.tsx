'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { db } from './db';
import { fetchAPI } from './api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, username: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch user profile
  const fetchUserProfile = async () => {
    try {
      const userData = await fetchAPI('/auth/me');
      // Map API response to User type if needed, or use directly
      // Assuming API returns { id, name, email } 
      // The current User type might have 'username' which maps to 'name' from API
      // Adjusting based on standard conventions, we might need to cast or map
      setUser({
        id: userData.id,
        username: userData.name,
        email: userData.email,
        password: '', // Password is not returned by API
        researchInterests: [], // Not yet in this API endpoint
        createdAt: new Date().toISOString(), // Fallback
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      localStorage.removeItem('access_token');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetchUserProfile();
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('access_token', data.access_token);
      await fetchUserProfile();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (email: string, username: string, password: string, confirmPassword: string): Promise<boolean> => {
    try {
      // The backend expects 'name', 'email', 'password', 'confirm_password'
      await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: username,
          email,
          password,
          confirm_password: confirmPassword
        }),
      });

      // Auto-login after signup
      return await login(email, password);
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('userId'); // Cleanup old mock key
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
