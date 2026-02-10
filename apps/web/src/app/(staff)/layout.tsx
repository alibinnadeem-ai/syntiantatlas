'use client';

import { AuthGuard } from '@/components/features/auth/auth-guard';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import type { NavItem } from '@/components/layout/dashboard-layout';
import { FiHome, FiMessageSquare, FiShield, FiSettings } from 'react-icons/fi';

const staffNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/staff', icon: <FiHome /> },
  { label: 'Tickets', href: '/staff/tickets', icon: <FiMessageSquare /> },
  { label: 'KYC Review', href: '/staff/kyc', icon: <FiShield /> },
  { label: 'Settings', href: '/staff/settings', icon: <FiSettings /> },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard roles={['staff']}>
      <DashboardLayout navItems={staffNavItems}>{children}</DashboardLayout>
    </AuthGuard>
  );
}
