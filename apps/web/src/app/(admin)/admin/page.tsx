'use client';

import Link from 'next/link';
import { FiUsers, FiGrid, FiClock, FiDollarSign, FiArrowRight } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

const statCards = [
  {
    label: 'Total Users',
    icon: FiUsers,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    label: 'Active Properties',
    icon: FiGrid,
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
  {
    label: 'Pending Approvals',
    icon: FiClock,
    color: 'bg-yellow-500',
    lightColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
  },
  {
    label: 'Total Transactions',
    icon: FiDollarSign,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
];

export default function AdminDashboardPage() {
  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.getUsers({ page: 1, limit: 1 }),
  });

  const { data: pendingProperties } = useQuery({
    queryKey: ['admin', 'pendingProperties'],
    queryFn: () => api.getPendingProperties(),
  });

  const statValues = [
    usersData?.pagination?.total ?? '--',
    '--',
    pendingProperties?.length ?? '--',
    '--',
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of platform activity and management.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const value = statValues[i];
          return (
            <div key={card.label} className="card flex items-start gap-4">
              <div
                className={`w-12 h-12 ${card.lightColor} rounded-lg flex items-center justify-center`}
              >
                <Icon className={`text-xl ${card.textColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {value === '--' ? (
                    <span className="text-base text-gray-400">Coming soon</span>
                  ) : (
                    value
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/properties"
            className="card group hover:border-dao-blue/30 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Review Properties</h3>
              <p className="text-sm text-gray-500 mt-1">
                {pendingProperties?.length ?? 0} pending review
              </p>
            </div>
            <FiArrowRight className="text-gray-400 group-hover:text-dao-blue transition-colors" />
          </Link>

          <Link
            href="/admin/users"
            className="card group hover:border-dao-blue/30 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-500 mt-1">
                View and manage platform users
              </p>
            </div>
            <FiArrowRight className="text-gray-400 group-hover:text-dao-blue transition-colors" />
          </Link>

          <Link
            href="/admin/kyc"
            className="card group hover:border-dao-blue/30 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-900">KYC Queue</h3>
              <p className="text-sm text-gray-500 mt-1">
                Review identity verifications
              </p>
            </div>
            <FiArrowRight className="text-gray-400 group-hover:text-dao-blue transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
