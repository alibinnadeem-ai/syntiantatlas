'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[];
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user, getDashboardPath } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (roles && roles.length > 0 && user?.roleId) {
      if (!roles.includes(user.roleId)) {
        router.push(getDashboardPath(user.roleId));
      }
    }
  }, [isAuthenticated, isLoading, user, roles, router, getDashboardPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-dao-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roles && roles.length > 0 && user?.roleId && !roles.includes(user.roleId)) {
    return null;
  }

  return <>{children}</>;
}
