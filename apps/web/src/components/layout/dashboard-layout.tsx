'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiLogOut, FiUser, FiSettings, FiArrowLeft, FiHome } from 'react-icons/fi';
import { useAuth } from '@/hooks/use-auth';
import { NotificationBell } from '@/components/features/notifications/notification-bell';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
}

export function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, getDashboardPath } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derive page title from matching nav item or fallback to pathname
  const currentNav = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );
  const pageTitle =
    currentNav?.label ??
    pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) ??
    'Dashboard';

  const initials =
    `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'U';

  const walletBalance = user?.walletBalance ?? 0;

  // Determine if we're on a sub-page (not the main dashboard root)
  const dashboardRoot = getDashboardPath(user?.roleId);
  const isSubPage = pathname !== dashboardRoot && !navItems.some((item) => item.href === pathname);

  // Derive the settings path for the current role
  const settingsPath = (() => {
    const roleId = user?.roleId;
    if (roleId === 'seller') return '/seller/settings';
    if (roleId === 'admin' || roleId === 'operations_manager') return '/admin/account';
    if (roleId === 'staff') return '/staff/settings';
    return '/settings';
  })();

  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 z-30 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[280px]'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center px-4 h-16 border-b border-gray-100 shrink-0">
          <Image
            src="/assets/syntiant-atlas-logo.png"
            alt="Syntiant Atlas"
            width={collapsed ? 40 : 150}
            height={40}
            className="shrink-0 object-contain"
          />
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 min-h-0 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                  isActive
                    ? 'bg-dao-blue/10 text-dao-blue font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="px-3 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors duration-150"
          >
            {collapsed ? (
              <FiChevronRight className="text-lg" />
            ) : (
              <>
                <FiChevronLeft className="text-lg" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          collapsed ? 'ml-[72px]' : 'ml-[280px]'
        }`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            {isSubPage && (
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                title="Go back"
              >
                <FiArrowLeft className="text-lg" />
              </button>
            )}
            {/* Home Button */}
            <Link
              href={dashboardRoot}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Home"
            >
              <FiHome className="text-base" />
            </Link>
            <h1 className="text-lg font-semibold text-dao-dark">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet Balance Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-dao-blue/10 text-dao-blue text-sm font-medium px-3 py-1.5 rounded-full">
              <span>PKR</span>
              <span>{Number(walletBalance).toLocaleString()}</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Avatar & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="w-9 h-9 rounded-full bg-dao-blue flex items-center justify-center text-white text-sm font-medium hover:bg-dao-blue-dark transition-colors"
              >
                {initials}
              </button>

              {avatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {/* User Info */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-dao-dark truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>

                  <Link
                    href={settingsPath}
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiUser className="text-base" />
                    Profile
                  </Link>
                  <Link
                    href={settingsPath}
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiSettings className="text-base" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setAvatarOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut className="text-base" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
