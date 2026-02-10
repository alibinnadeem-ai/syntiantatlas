'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FiGrid, FiDollarSign, FiTrendingUp, FiPlus, FiMapPin } from 'react-icons/fi';
import { api } from '@/lib/api-client';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  funded: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function SellerDashboardPage() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ['seller', 'properties'],
    queryFn: () => api.getSellerProperties(),
  });

  const totalProperties = properties?.length ?? 0;
  const activeListings = properties?.filter((p) => p.status === 'active').length ?? 0;
  const totalFundingRaised = properties?.reduce(
    (sum, p) => sum + Number(p.fundingRaised || 0),
    0,
  ) ?? 0;

  const statCards = [
    {
      label: 'My Properties',
      value: totalProperties,
      icon: <FiGrid />,
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Funding Raised',
      value: `PKR ${totalFundingRaised.toLocaleString()}`,
      icon: <FiDollarSign />,
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Active Listings',
      value: activeListings,
      icon: <FiTrendingUp />,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your property listings and track performance.
          </p>
        </div>
        <Link href="/seller/new-property" className="btn-blue flex items-center gap-2 !py-2.5 !px-4 text-sm w-fit">
          <FiPlus /> Add Property
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="card flex items-start gap-4">
            <div
              className={`w-12 h-12 ${card.lightColor} rounded-lg flex items-center justify-center`}
            >
              <span className={`text-xl ${card.textColor}`}>{card.icon}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* My Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Properties</h2>
          <Link href="/seller/properties" className="text-sm text-dao-blue hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-2 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : !properties || properties.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiGrid className="text-2xl text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No properties yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              List your first property to start receiving investments.
            </p>
            <Link href="/seller/new-property" className="btn-blue inline-flex items-center gap-2 !py-2.5 !px-4 text-sm">
              <FiPlus /> Add Property
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.slice(0, 6).map((property) => (
              <div key={property.id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ml-2 ${
                      STATUS_COLORS[property.status || ''] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {property.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                </div>

                {property.location && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <FiMapPin className="text-gray-400 shrink-0" />
                    <span className="truncate">{property.location}</span>
                  </div>
                )}

                {property.fundingTarget && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Funding Progress</span>
                      <span>
                        {Math.round(
                          ((Number(property.fundingRaised) || 0) / Number(property.fundingTarget)) * 100,
                        )}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-dao-blue rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            ((Number(property.fundingRaised) || 0) / Number(property.fundingTarget)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
