import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { user: u, family: f } = await apiGet('/auth/me');
      setUser(u);
      setFamily(f || null);
    } catch {
      setUser(null);
      setFamily(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    const { user: u, family: f } = await apiPost('/auth/login', { email, password });
    setUser(u);
    setFamily(f || null);
    return u;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { user: u, family: f } = await apiPost('/auth/register', { name, email, password });
    setUser(u);
    setFamily(f || null);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await apiPost('/auth/logout');
    setUser(null);
    setFamily(null);
  }, []);

  const value = {
    user,
    family,
    loading,
    login,
    register,
    logout,
    refreshUser: loadUser,
    isParent: user?.role === 'parent',
    isKid: user?.role === 'kid',
    isAdmin: Boolean(user?.is_admin),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
