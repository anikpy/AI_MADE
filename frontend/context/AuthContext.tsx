'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await axios.post('/api/auth/login', { username, password });
    if (res.data.access) {
      sessionStorage.setItem('_at', res.data.access);
    }
    await fetchMe();
  };

  const register = async (data: Record<string, string>) => {
    const res = await axios.post('/api/auth/register', data);
    if (res.data.access) {
      sessionStorage.setItem('_at', res.data.access);
    }
    await fetchMe();
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } finally {
      sessionStorage.removeItem('_at');
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
