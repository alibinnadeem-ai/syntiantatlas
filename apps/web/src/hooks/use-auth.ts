'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api-client';

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    store.loadFromStorage();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login({ email, password });
    store.setAuth(data.user, data.accessToken);
    return data.user;
  }, [store]);

  const register = useCallback(async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleId: string;
  }) => {
    const data = await api.register(userData);
    store.setAuth(data.user, data.accessToken);
    return data.user;
  }, [store]);

  const logout = useCallback(() => {
    store.logout();
    router.push('/login');
  }, [store, router]);

  const getDashboardPath = useCallback((roleId?: string | null) => {
    switch (roleId) {
      case 'admin':
      case 'operations_manager':
        return '/admin';
      case 'seller':
        return '/seller';
      case 'staff':
        return '/staff';
      default:
        return '/dashboard';
    }
  }, []);

  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login,
    register,
    logout,
    getDashboardPath,
  };
}
