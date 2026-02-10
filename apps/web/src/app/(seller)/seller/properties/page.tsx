'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FiPlus, FiMapPin, FiGrid, FiEdit2, FiEye } from 'react-icons/fi';
import { api } from '@/lib/api-client';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  funded: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function SellerPropertiesPage() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ['seller', 'properties'],
    queryFn: () => api.getSellerProperties(),
  });

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage all your listed properties.
          </p>
        </div>
        <Link
          href="/seller/new-property"
          className="btn-blue flex items-center gap-2 !py-2.5 !px-4 text-sm w-fit"
        >
          <FiPlus /> Add New Property
        </Link>
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-2 bg-gray-100 rounded w-full mb-2" />
              <div className="h-2 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : !properties || properties.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiGrid className="text-2xl text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No properties listed yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Start by adding your first property listing.
          </p>
          <Link
            href="/seller/new-property"
            className="btn-blue inline-flex items-center gap-2 !py-2.5 !px-4 text-sm"
          >
            <FiPlus /> Add New Property
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => {
            const canEdit = ['pending', 'rejected'].includes(property.status || '');
            return (
              <div key={property.id} className="card space-y-3 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${
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

                {property.propertyType && (
                  <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs capitalize">
                    {property.propertyType}
                  </span>
                )}

                {property.fundingTarget && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Funding Progress</span>
                      <span>
                        PKR {Number(property.fundingRaised || 0).toLocaleString()} / PKR{' '}
                        {Number(property.fundingTarget).toLocaleString()}
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

                {property.totalValue && (
                  <div className="pt-2 border-t border-gray-50 flex justify-between text-sm">
                    <span className="text-gray-500">Total Value</span>
                    <span className="font-medium text-gray-900">
                      PKR {Number(property.totalValue).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-gray-50 flex items-center gap-2">
                  <Link
                    href={`/seller/properties/${property.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <FiEye /> View
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/seller/properties/${property.id}/edit`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-dao-blue border border-dao-blue/20 hover:bg-dao-blue/5 transition-colors"
                    >
                      <FiEdit2 /> Edit
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
