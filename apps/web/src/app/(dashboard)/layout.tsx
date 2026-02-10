'use client';

import { FiHome, FiGrid, FiPieChart, FiCreditCard, FiList, FiShield, FiMessageSquare, FiUsers, FiSettings } from 'react-icons/fi';
import { AuthGuard } from '@/components/features/auth/auth-guard';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import type { NavItem } from '@/components/layout/dashboard-layout';

const investorNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <FiHome /> },
  { label: 'Properties', href: '/properties', icon: <FiGrid /> },
  { label: 'Portfolio', href: '/portfolio', icon: <FiPieChart /> },
  { label: 'Wallet', href: '/wallet', icon: <FiCreditCard /> },
  { label: 'Transactions', href: '/transactions', icon: <FiList /> },
  { label: 'KYC', href: '/kyc', icon: <FiShield /> },
  { label: 'Support', href: '/tickets', icon: <FiMessageSquare /> },
  { label: 'Governance', href: '/governance', icon: <FiUsers /> },
  { label: 'Settings', href: '/settings', icon: <FiSettings /> },
];

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout navItems={investorNavItems}>{children}</DashboardLayout>
    </AuthGuard>
  );
}
