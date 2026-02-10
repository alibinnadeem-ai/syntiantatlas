'use client';

import Link from 'next/link';
import {
  FiMessageSquare,
  FiAlertCircle,
  FiShield,
  FiUser,
  FiArrowRight,
  FiClock,
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { Ticket } from '@/types';

const priorityBadge: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusBadge: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function StaffDashboardPage() {
  const { user } = useAuth();

  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    isError: ticketsError,
  } = useQuery({
    queryKey: ['staff', 'tickets'],
    queryFn: () => api.getAdminTickets({ page: 1, limit: 50 }),
  });

  const {
    data: kycData,
    isLoading: kycLoading,
    isError: kycError,
  } = useQuery({
    queryKey: ['staff', 'kyc'],
    queryFn: () => api.getKycSubmissions({ page: 1, limit: 50, status: 'pending' }),
  });

  const isLoading = ticketsLoading || kycLoading;
  const isError = ticketsError || kycError;

  const tickets = ticketsData?.data ?? [];
  const totalTickets = ticketsData?.pagination?.total ?? 0;
  const openTickets = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  ).length;
  const assignedToMe = tickets.filter(
    (t) => t.assignedTo === user?.id
  ).length;
  const pendingKyc = kycData?.pagination?.total ?? 0;

  const recentTickets = tickets.slice(0, 5);

  const statCards = [
    {
      label: 'Total Tickets',
      value: totalTickets,
      icon: FiMessageSquare,
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Open Tickets',
      value: openTickets,
      icon: FiAlertCircle,
      lightColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      label: 'Pending KYC',
      value: pendingKyc,
      icon: FiShield,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Assigned to Me',
      value: assignedToMe,
      icon: FiUser,
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="card">
          <div className="h-40 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        </div>
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-3xl text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load dashboard data
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Something went wrong while fetching your dashboard data. Please try
            refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName ?? 'Staff'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here is an overview of your current workload and pending tasks.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card flex items-start gap-4">
              <div
                className={`w-12 h-12 ${card.lightColor} rounded-lg flex items-center justify-center shrink-0`}
              >
                <Icon className={`text-xl ${card.textColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/staff/tickets"
            className="card group hover:border-dao-blue/30 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-900">View Tickets</h3>
              <p className="text-sm text-gray-500 mt-1">
                {openTickets} open ticket{openTickets !== 1 ? 's' : ''} requiring attention
              </p>
            </div>
            <FiArrowRight className="text-gray-400 group-hover:text-dao-blue transition-colors" />
          </Link>

          <Link
            href="/staff/kyc"
            className="card group hover:border-dao-blue/30 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Review KYC</h3>
              <p className="text-sm text-gray-500 mt-1">
                {pendingKyc} pending verification{pendingKyc !== 1 ? 's' : ''} to review
              </p>
            </div>
            <FiArrowRight className="text-gray-400 group-hover:text-dao-blue transition-colors" />
          </Link>
        </div>
      </div>

      {/* Recent Tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
          <Link
            href="/staff/tickets"
            className="text-sm text-dao-blue hover:underline flex items-center gap-1"
          >
            View all <FiArrowRight className="text-xs" />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="card text-center py-10">
            <FiMessageSquare className="text-3xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tickets found.</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left font-medium text-gray-500 px-4 py-3">ID</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Title</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Priority</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket: Ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500">#{ticket.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {ticket.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          priorityBadge[ticket.priority ?? 'low'] ?? priorityBadge.low
                        }`}
                      >
                        {ticket.priority ?? 'low'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          statusBadge[ticket.status ?? 'open'] ?? statusBadge.open
                        }`}
                      >
                        {(ticket.status ?? 'open').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <FiClock className="text-xs" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
