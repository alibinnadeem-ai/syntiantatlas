'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FiDollarSign,
  FiTrendingUp,
  FiGrid,
  FiPieChart,
  FiArrowUpRight,
  FiArrowDownLeft,
} from 'react-icons/fi';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
}

function StatCard({ title, value, icon, gradient }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 text-white ${gradient}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium opacity-90">{title}</span>
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loader                                                    */
/* ------------------------------------------------------------------ */

function StatCardSkeleton() {
  return (
    <div className="rounded-xl p-5 bg-gray-200 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-gray-300 rounded" />
        <div className="w-10 h-10 rounded-lg bg-gray-300" />
      </div>
      <div className="h-7 w-32 bg-gray-300 rounded" />
    </div>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 rounded" />
          </div>
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPKR(value: string | number): string {
  return `PKR ${Number(value).toLocaleString()}`;
}

function txnIconColor(type: string): { bg: string; icon: React.ReactNode } {
  switch (type) {
    case 'deposit':
      return {
        bg: 'bg-green-100 text-green-600',
        icon: <FiArrowDownLeft className="text-base" />,
      };
    case 'withdrawal':
      return {
        bg: 'bg-red-100 text-red-600',
        icon: <FiArrowUpRight className="text-base" />,
      };
    case 'investment':
      return {
        bg: 'bg-blue-100 text-blue-600',
        icon: <FiTrendingUp className="text-base" />,
      };
    default:
      return {
        bg: 'bg-gray-100 text-gray-600',
        icon: <FiDollarSign className="text-base" />,
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Dashboard Page                                                     */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    data: wallet,
    isLoading: walletLoading,
  } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.getWallet(),
  });

  const {
    data: portfolio,
    isLoading: portfolioLoading,
  } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.getPortfolio(),
  });

  const isLoading = walletLoading || portfolioLoading;

  const walletBalance = wallet?.balance ?? '0';
  const totalInvested = portfolio?.summary?.totalInvested ?? '0';
  const propertyCount = portfolio?.summary?.propertyCount ?? 0;
  const recentTransactions = wallet?.recentTransactions?.slice(0, 5) ?? [];
  const investments = portfolio?.investments ?? [];

  // Portfolio value = total invested (can be extended with appreciation later)
  const portfolioValue = totalInvested;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-dao-dark">
          Welcome back, {user?.firstName ?? 'Investor'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Here is an overview of your account and investments.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Wallet Balance"
              value={formatPKR(walletBalance)}
              icon={<FiDollarSign className="text-lg" />}
              gradient="bg-gradient-to-br from-dao-blue to-blue-600"
            />
            <StatCard
              title="Total Invested"
              value={formatPKR(totalInvested)}
              icon={<FiTrendingUp className="text-lg" />}
              gradient="bg-gradient-to-br from-emerald-500 to-green-600"
            />
            <StatCard
              title="Properties"
              value={String(propertyCount)}
              icon={<FiGrid className="text-lg" />}
              gradient="bg-gradient-to-br from-purple-500 to-violet-600"
            />
            <StatCard
              title="Portfolio Value"
              value={formatPKR(portfolioValue)}
              icon={<FiPieChart className="text-lg" />}
              gradient="bg-gradient-to-br from-orange-500 to-amber-600"
            />
          </>
        )}
      </div>

      {/* Two-column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-dao-dark mb-4">Recent Transactions</h3>

          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No transactions yet.</p>
              <Link
                href="/wallet"
                className="inline-block mt-3 text-sm font-medium text-dao-blue hover:underline"
              >
                Make your first deposit
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((txn) => {
                const { bg, icon } = txnIconColor(txn.type);
                return (
                  <div key={txn.id} className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bg}`}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 capitalize truncate">
                        {txn.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(txn.createdAt).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        txn.type === 'deposit' || txn.type === 'dividend'
                          ? 'text-green-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {txn.type === 'deposit' || txn.type === 'dividend' ? '+' : '-'}
                      {formatPKR(txn.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Your Investments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-dao-dark mb-4">Your Investments</h3>

          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : investments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No investments yet.</p>
              <Link
                href="/properties"
                className="inline-block mt-3 text-sm font-medium text-dao-blue hover:underline"
              >
                Browse properties to invest
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {investments.slice(0, 5).map((inv) => (
                <div key={inv.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-dao-blue/10 text-dao-blue flex items-center justify-center shrink-0">
                    <FiGrid className="text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {inv.property?.title ?? `Property #${inv.propertyId}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {inv.ownershipPercentage
                        ? `${Number(inv.ownershipPercentage).toFixed(2)}% ownership`
                        : `${inv.sharesOwned ?? 0} shares`}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPKR(inv.amountInvested)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
