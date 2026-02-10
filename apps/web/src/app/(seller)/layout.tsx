'use client';

import { AuthGuard } from '@/components/features/auth/auth-guard';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import type { NavItem } from '@/components/layout/dashboard-layout';
import { FiHome, FiGrid, FiPlus, FiSettings } from 'react-icons/fi';

const sellerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/seller', icon: <FiHome /> },
  { label: 'My Properties', href: '/seller/properties', icon: <FiGrid /> },
  { label: 'Add Property', href: '/seller/new-property', icon: <FiPlus /> },
  { label: 'Settings', href: '/seller/settings', icon: <FiSettings /> },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard roles={['seller']}>
      <DashboardLayout navItems={sellerNavItems}>{children}</DashboardLayout>
    </AuthGuard>
  );
}
