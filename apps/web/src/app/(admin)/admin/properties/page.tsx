'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiCheck, FiX, FiMapPin, FiDollarSign } from 'react-icons/fi';
import { api } from '@/lib/api-client';
import type { Property } from '@/types';

type Tab = 'pending' | 'all';

export default function AdminPropertiesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: pendingProperties, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin', 'pendingProperties'],
    queryFn: () => api.getPendingProperties(),
  });

  const { data: allPropertiesData, isLoading: allLoading } = useQuery({
    queryKey: ['admin', 'allProperties'],
    queryFn: () => api.getProperties({ page: 1, limit: 50 }),
    enabled: activeTab === 'all',
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.updatePropertyStatus(id, { status: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingProperties'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'allProperties'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.updatePropertyStatus(id, { status: 'rejected', reason }),
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingProperties'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'allProperties'] });
    },
  });

  const handleReject = (id: number) => {
    if (!rejectReason.trim()) return;
    rejectMutation.mutate({ id, reason: rejectReason });
  };

  const renderPropertyCard = (property: Property, showActions: boolean) => (
    <div key={property.id} className="card space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{property.title}</h3>
          {property.seller && (
            <p className="text-sm text-gray-500 mt-0.5">
              by {property.seller.firstName} {property.seller.lastName}
            </p>
          )}
        </div>
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
            property.status === 'active'
              ? 'bg-green-100 text-green-700'
              : property.status === 'pending_review'
                ? 'bg-yellow-100 text-yellow-700'
                : property.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
          }`}
        >
          {property.status?.replace('_', ' ') || 'Unknown'}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {property.location && (
          <div className="flex items-center gap-1.5">
            <FiMapPin className="text-gray-400" />
            {property.location}
          </div>
        )}
        {property.totalValue && (
          <div className="flex items-center gap-1.5">
            <FiDollarSign className="text-gray-400" />
            PKR {Number(property.totalValue).toLocaleString()}
          </div>
        )}
        {property.propertyType && (
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs capitalize">
            {property.propertyType}
          </span>
        )}
      </div>

      {property.fundingTarget && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Funding Target</span>
            <span>PKR {Number(property.fundingTarget).toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-dao-blue rounded-full"
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

      {showActions && (
        <div className="pt-2 border-t border-gray-100">
          {rejectingId === property.id ? (
            <div className="space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRejectingId(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(property.id)}
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => approveMutation.mutate(property.id)}
                disabled={approveMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <FiCheck /> Approve
              </button>
              <button
                onClick={() => setRejectingId(property.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                <FiX /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage property listings.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'pending'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Review
          {pendingProperties && pendingProperties.length > 0 && (
            <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pendingProperties.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Properties
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingLoading ? (
            <div className="card text-center py-12">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-dao-blue border-t-transparent rounded-full animate-spin" />
                Loading pending properties...
              </div>
            </div>
          ) : !pendingProperties || pendingProperties.length === 0 ? (
            <div className="card text-center py-12">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="text-2xl text-green-500" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">All caught up!</h3>
              <p className="text-sm text-gray-500">No properties pending review.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingProperties.map((property) => renderPropertyCard(property, true))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="space-y-4">
          {allLoading ? (
            <div className="card text-center py-12">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-dao-blue border-t-transparent rounded-full animate-spin" />
                Loading properties...
              </div>
            </div>
          ) : !allPropertiesData?.data || allPropertiesData.data.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-sm text-gray-500">No properties found.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {allPropertiesData.data.map((property) => renderPropertyCard(property, false))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
