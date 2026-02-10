'use client';

import { AuthGuard } from '@/components/features/auth/auth-guard';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import type { NavItem } from '@/components/layout/dashboard-layout';
import { FiHome, FiUsers, FiGrid, FiShield, FiMessageSquare, FiSliders, FiSettings } from 'react-icons/fi';

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <FiHome /> },
  { label: 'Users', href: '/admin/users', icon: <FiUsers /> },
  { label: 'Properties', href: '/admin/properties', icon: <FiGrid /> },
  { label: 'KYC Queue', href: '/admin/kyc', icon: <FiShield /> },
  { label: 'Tickets', href: '/admin/tickets', icon: <FiMessageSquare /> },
  { label: 'System Settings', href: '/admin/settings', icon: <FiSliders /> },
  { label: 'Settings', href: '/admin/account', icon: <FiSettings /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard roles={['admin', 'operations_manager', 'staff']}>
      <DashboardLayout navItems={adminNavItems}>{children}</DashboardLayout>
    </AuthGuard>
  );
}
