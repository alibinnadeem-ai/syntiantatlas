'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FiDollarSign,
  FiHome,
  FiPieChart,
  FiExternalLink,
  FiTrendingUp,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import type { Investment } from '@/types';

function formatPKR(value: string | null | undefined): string {
  if (!value) return 'PKR 0';
  const num = parseFloat(value);
  if (isNaN(num)) return 'PKR 0';
  if (num >= 10_000_000) return `PKR ${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `PKR ${(num / 100_000).toFixed(2)} Lac`;
  return `PKR ${num.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-3/4" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card animate-pulse space-y-4">
      <div className="h-5 bg-gray-200 rounded w-1/4" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

export default function PortfolioPage() {
  const { data: portfolio, isLoading, isError } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.getPortfolio(),
  });

  const investments = portfolio?.investments ?? [];
  const summary = portfolio?.summary;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
        <p className="mt-2 text-gray-600">
          Track and manage your real estate investments.
        </p>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <div className="card flex items-start gap-4">
            <div className="w-10 h-10 bg-dao-blue/10 rounded-lg flex items-center justify-center shrink-0">
              <FiDollarSign className="text-dao-blue text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Invested</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatPKR(summary?.totalInvested)}
              </p>
            </div>
          </div>

          <div className="card flex items-start gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
              <FiHome className="text-green-600 text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Properties Owned</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {summary?.propertyCount ?? 0}
              </p>
            </div>
          </div>

          <div className="card flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
              <FiPieChart className="text-purple-600 text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Shares</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {summary?.totalShares ? parseFloat(summary.totalShares).toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-16">
          <p className="text-red-500 text-lg font-medium">Failed to load portfolio.</p>
          <p className="text-gray-500 mt-1 text-sm">Please try again later.</p>
        </div>
      )}

      {/* Loading Skeleton for Table */}
      {isLoading && <TableSkeleton />}

      {/* Empty State */}
      {!isLoading && !isError && investments.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiTrendingUp className="text-gray-400 text-2xl" />
          </div>
          <p className="text-gray-700 text-lg font-medium">
            You haven&apos;t made any investments yet
          </p>
          <p className="text-gray-500 mt-1 text-sm mb-6">
            Start building your real estate portfolio today.
          </p>
          <Link href="/properties" className="btn-blue inline-flex items-center gap-2">
            Browse Properties
            <FiExternalLink className="text-sm" />
          </Link>
        </div>
      )}

      {/* Investments Table */}
      {!isLoading && !isError && investments.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Your Investments</h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Property</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Amount Invested</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Shares</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Ownership</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                  <th className="px-6 py-3 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {investments.map((inv: Investment & { property: any }) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {inv.property?.title || `Property #${inv.propertyId}`}
                        </p>
                        {inv.property?.city && (
                          <p className="text-xs text-gray-400 mt-0.5">{inv.property.city}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {formatPKR(inv.amountInvested)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {inv.sharesOwned ? parseFloat(inv.sharesOwned).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {inv.ownershipPercentage ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-dao-blue/10 text-dao-blue">
                          {parseFloat(inv.ownershipPercentage).toFixed(2)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(inv.investmentDate)}
                    </td>
                    <td className="px-6 py-4">
                      {inv.propertyId && (
                        <Link
                          href={`/properties/${inv.propertyId}`}
                          className="text-dao-blue hover:text-dao-blue-dark text-xs font-medium hover:underline"
                        >
                          View Property
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-gray-100">
            {investments.map((inv: Investment & { property: any }) => (
              <div key={inv.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {inv.property?.title || `Property #${inv.propertyId}`}
                    </p>
                    {inv.property?.city && (
                      <p className="text-xs text-gray-400">{inv.property.city}</p>
                    )}
                  </div>
                  {inv.propertyId && (
                    <Link
                      href={`/properties/${inv.propertyId}`}
                      className="text-dao-blue text-xs font-medium"
                    >
                      View
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Invested</p>
                    <p className="font-semibold text-gray-800">{formatPKR(inv.amountInvested)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Shares</p>
                    <p className="font-medium text-gray-700">
                      {inv.sharesOwned ? parseFloat(inv.sharesOwned).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Ownership</p>
                    <p className="font-medium text-gray-700">
                      {inv.ownershipPercentage
                        ? `${parseFloat(inv.ownershipPercentage).toFixed(2)}%`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date</p>
                    <p className="font-medium text-gray-700">{formatDate(inv.investmentDate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
