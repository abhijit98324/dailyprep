import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, setStoredToken } from '../lib/api';
import type { LanguageOption, UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, password: string) => Promise<UserProfile>;
  registerWithEmail: (displayName: string, email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updatePreferences: (data: {
    selectedExams?: string[];
    primaryExam?: string;
    language?: LanguageOption;
    onboarded?: boolean;
    displayName?: string;
  }) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch<{ user: UserProfile | null }>('/api/auth/me');
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginWithEmail = async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const registerWithEmail = async (displayName: string, email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ displayName, email, password }),
    });
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setStoredToken(null);
    setUser(null);
  };

  const updatePreferences = async (data: {
    selectedExams?: string[];
    primaryExam?: string;
    language?: LanguageOption;
    onboarded?: boolean;
    displayName?: string;
  }) => {
    const res = await apiFetch<{ user: UserProfile }>('/api/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setUser(res.user);
    return res.user;
  };

  const isPremium = Boolean(
    user &&
      (user.role === 'admin' ||
        (user.plan === 'premium' && (!user.premiumUntil || new Date(user.premiumUntil) > new Date())))
  );

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPremium,
        isAdmin,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshUser,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}