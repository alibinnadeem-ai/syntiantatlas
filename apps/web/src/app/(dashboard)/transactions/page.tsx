'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Transaction, TransactionSummary } from '@/types';
import { format } from 'date-fns';
import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiTrendingUp,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiInbox,
} from 'react-icons/fi';

function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'investment', label: 'Investment' },
  { value: 'dividend', label: 'Dividend' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const TYPE_BADGE_STYLES: Record<string, string> = {
  deposit: 'bg-green-100 text-green-700',
  withdrawal: 'bg-red-100 text-red-700',
  investment: 'bg-blue-100 text-blue-700',
  dividend: 'bg-purple-100 text-purple-700',
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

function getTypeBadge(type: string) {
  const style = TYPE_BADGE_STYLES[type] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${style}`}>
      {type}
    </span>
  );
}

function getStatusBadge(status: string | null) {
  const s = status?.toLowerCase() ?? 'unknown';
  const style = STATUS_BADGE_STYLES[s] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${style}`}>
      {s}
    </span>
  );
}

/* ─── Summary Card ─── */
function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    green: 'bg-green-50',
    red: 'bg-red-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
  };
  const iconBgMap: Record<string, string> = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className={`card ${bgMap[color] ?? 'bg-gray-50'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgMap[color] ?? 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
      <p className="text-xl font-bold text-gray-900">PKR {formatCurrency(value)}</p>
    </div>
  );
}

/* ─── Skeleton Loaders ─── */
function SummarySkeletons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
          <div className="h-6 w-32 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Date', 'Type', 'Amount', 'Payment Method', 'Reference', 'Status'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50 animate-pulse">
                <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-100 rounded" /></td>
                <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 rounded-full" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 rounded-full" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Main Transactions Page ─── */
export default function TransactionsPage() {
  const [filters, setFilters] = useState<Record<string, string | number>>({
    page: 1,
    limit: 10,
  });

  const setFilter = (key: string, value: string | number) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value, page: key === 'page' ? value : 1 };
      // Remove empty string filters
      if (value === '') {
        delete next[key];
      }
      return next;
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => api.getTransactions(filters),
  });

  const transactions: Transaction[] = data?.data ?? [];
  const summary: TransactionSummary | undefined = data?.summary;
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0, limit: 10 };
  const currentPage = typeof pagination.page === 'string' ? parseInt(pagination.page) : pagination.page;
  const totalPages = typeof pagination.totalPages === 'string' ? parseInt(pagination.totalPages) : pagination.totalPages;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and filter all your financial transactions.
        </p>
      </div>

      {/* ─── Summary Cards ─── */}
      {isLoading || !summary ? (
        <SummarySkeletons />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Deposits"
            value={summary.totalDeposits}
            icon={<FiArrowDownCircle className="text-lg" />}
            color="green"
          />
          <SummaryCard
            label="Total Withdrawals"
            value={summary.totalWithdrawals}
            icon={<FiArrowUpCircle className="text-lg" />}
            color="red"
          />
          <SummaryCard
            label="Total Investments"
            value={summary.totalInvestments}
            icon={<FiTrendingUp className="text-lg" />}
            color="blue"
          />
          <SummaryCard
            label="Total Dividends"
            value={summary.totalDividends}
            icon={<FiDollarSign className="text-lg" />}
            color="purple"
          />
        </div>
      )}

      {/* ─── Filter Bar ─── */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <FiFilter className="text-base" />
            Filters
          </div>

          <select
            value={(filters.type as string) ?? ''}
            onChange={(e) => setFilter('type', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue outline-none bg-white"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={(filters.status as string) ?? ''}
            onChange={(e) => setFilter('status', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue outline-none bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={(filters.startDate as string) ?? ''}
            onChange={(e) => setFilter('startDate', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue outline-none"
            placeholder="Start date"
          />
          <input
            type="date"
            value={(filters.endDate as string) ?? ''}
            onChange={(e) => setFilter('endDate', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue outline-none"
            placeholder="End date"
          />
        </div>
      </div>

      {/* ─── Table ─── */}
      {isLoading ? (
        <TableSkeleton />
      ) : transactions.length === 0 ? (
        <div className="card text-center py-16">
          <FiInbox className="mx-auto text-5xl text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No transactions found.</p>
          <p className="text-gray-400 text-sm mt-1">
            Try adjusting your filters or make your first transaction.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Date', 'Type', 'Amount', 'Payment Method', 'Reference', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                      {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                      <span className="block text-xs text-gray-400">
                        {format(new Date(tx.createdAt), 'h:mm a')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{getTypeBadge(tx.type)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      PKR {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                      {tx.paymentMethod ?? '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 font-mono whitespace-nowrap">
                      {tx.referenceNumber ?? '-'}
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(tx.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination ─── */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/30">
            <p className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-medium text-gray-700">
                {(currentPage - 1) * pagination.limit + 1}
              </span>
              {' '}-{' '}
              <span className="font-medium text-gray-700">
                {Math.min(currentPage * pagination.limit, pagination.total)}
              </span>
              {' '}of{' '}
              <span className="font-medium text-gray-700">{pagination.total}</span>{' '}
              transactions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('page', currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700
                           border border-gray-300 rounded-lg hover:bg-gray-100 transition
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="text-sm" />
                Previous
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setFilter('page', pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                      pageNum === currentPage
                        ? 'bg-dao-blue text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setFilter('page', currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700
                           border border-gray-300 rounded-lg hover:bg-gray-100 transition
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <FiChevronRight className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
