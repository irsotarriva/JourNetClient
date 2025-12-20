'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { db } from './db';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      db.users.findById(storedUserId).then(user => {
        if (user) {
          setUser(user);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await db.users.findByEmail(email);
      if (user && user.password === password) {
        setUser(user);
        localStorage.setItem('userId', user.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (email: string, username: string, password: string): Promise<boolean> => {
    try {
      // Check if user already exists
      const existingUser = await db.users.findByEmail(email);
      if (existingUser) {
        return false;
      }

      const newUser = await db.users.create({
        email,
        username,
        password,
        researchInterests: [],
      });

      setUser(newUser);
      localStorage.setItem('userId', newUser.id);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
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
