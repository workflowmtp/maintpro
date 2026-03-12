'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hasPermission as checkPerm } from '@/lib/roles';
import type { User, RoleId } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  getUserPoleId: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => null,
  logout: () => {},
  hasPermission: () => false,
  getUserPoleId: () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check saved session in localStorage
    try {
      const saved = localStorage.getItem('mp3_current_session');
      if (saved) {
        const session = JSON.parse(saved);
        if (session.user) {
          setUser(session.user);
        }
      }
    } catch {}
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!email) return 'Veuillez entrer votre email';
    if (!password) return 'Veuillez entrer votre mot de passe';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return data.error || 'Erreur de connexion';
      }

      setUser(data.user);
      localStorage.setItem('mp3_current_session', JSON.stringify({
        user: data.user,
        timestamp: new Date().toISOString(),
      }));
      return null; // no error
    } catch (err) {
      return 'Erreur de connexion au serveur';
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mp3_current_session');
  }, []);

  const hasPermission = useCallback((perm: string): boolean => {
    if (!user) return false;
    return checkPerm(user.role as RoleId, perm);
  }, [user]);

  const getUserPoleId = useCallback((): string | null => {
    if (!user) return null;
    return user.pole_id || null;
  }, [user]);

  if (!ready) {
    return null; // SSR guard
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasPermission, getUserPoleId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
