'use client';

import { useState } from 'react';
import {
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiFileText,
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { KycVerification } from '@/types';

type StatusFilter = 'pending' | 'all' | 'approved' | 'rejected';

const kycStatusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function StaffKycPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmReject, setConfirmReject] = useState<number | null>(null);

  const limit = 10;

  const queryParams: Record<string, string | number> = { page, limit };
  if (statusFilter !== 'all') {
    queryParams.status = statusFilter;
  }

  const {
    data: kycData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['staff', 'kyc', statusFilter, page],
    queryFn: () => api.getKycSubmissions(queryParams),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: string; rejectionReason?: string } }) =>
      api.reviewKyc(id, data),
    onSuccess: () => {
      setExpandedId(null);
      setConfirmReject(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['staff', 'kyc'] });
    },
  });

  const submissions = kycData?.data ?? [];
  const pagination = kycData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const handleApprove = (id: number) => {
    reviewMutation.mutate({ id, data: { status: 'approved' } });
  };

  const handleReject = (id: number) => {
    if (!rejectionReason.trim()) return;
    reviewMutation.mutate({
      id,
      data: { status: 'rejected', rejectionReason: rejectionReason.trim() },
    });
  };

  const handleFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setPage(1);
    setExpandedId(null);
    setConfirmReject(null);
    setRejectionReason('');
  };

  const toggleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setConfirmReject(null);
      setRejectionReason('');
    } else {
      setExpandedId(id);
      setConfirmReject(null);
      setRejectionReason('');
    }
  };

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'all', label: 'All' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Review</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and verify user identity submissions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              statusFilter === tab.key
                ? 'bg-white text-dao-dark shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-24 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-3xl text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load KYC submissions
          </h2>
          <p className="text-gray-500">
            Something went wrong. Please try refreshing the page.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && submissions.length === 0 && (
        <div className="card text-center py-12">
          <FiShield className="text-4xl text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No submissions found
          </h2>
          <p className="text-gray-500">
            {statusFilter === 'pending'
              ? 'There are no pending KYC submissions to review.'
              : statusFilter === 'approved'
              ? 'No approved submissions found.'
              : statusFilter === 'rejected'
              ? 'No rejected submissions found.'
              : 'There are no KYC submissions yet.'}
          </p>
        </div>
      )}

      {/* Submissions List */}
      {!isLoading && !isError && submissions.length > 0 && (
        <div className="space-y-4">
          {submissions.map((submission: KycVerification) => {
            const isExpanded = expandedId === submission.id;
            const isRejectMode = confirmReject === submission.id;
            const userName = submission.user
              ? `${submission.user.firstName ?? ''} ${submission.user.lastName ?? ''}`.trim() ||
                submission.user.email
              : `User #${submission.userId}`;

            return (
              <div key={submission.id} className="card overflow-hidden">
                {/* Summary Row */}
                <button
                  onClick={() => toggleExpand(submission.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <FiUser className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{userName}</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            kycStatusBadge[submission.status ?? 'pending'] ??
                            kycStatusBadge.pending
                          }`}
                        >
                          {submission.status ?? 'pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <FiFileText className="text-xs" />
                          {submission.documentType ?? 'Unknown document'}
                        </span>
                        <span>Level {submission.kycLevel ?? '--'}</span>
                        <span className="flex items-center gap-1">
                          <FiClock className="text-xs" />
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-400 shrink-0 ml-2">
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* User info */}
                    {submission.user && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Email</span>
                          <p className="text-gray-900">{submission.user.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Current KYC Status</span>
                          <p className="text-gray-900 capitalize">{submission.user.kycStatus ?? 'None'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Current KYC Level</span>
                          <p className="text-gray-900">{submission.user.kycLevel ?? 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs uppercase tracking-wide">Submitted</span>
                          <p className="text-gray-900">{new Date(submission.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {/* Document Data */}
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide block mb-2">
                        Document Data
                      </span>
                      {submission.documentData &&
                      Object.keys(submission.documentData).length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
                          {Object.entries(submission.documentData).map(
                            ([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-gray-500 capitalize min-w-[120px]">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
                                </span>
                                <span className="text-gray-900 break-all">
                                  {typeof value === 'string'
                                    ? value
                                    : JSON.stringify(value)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">
                          No document data available.
                        </p>
                      )}
                    </div>

                    {/* Reviewer info for already-reviewed submissions */}
                    {submission.reviewedAt && (
                      <div className="text-xs text-gray-400">
                        Reviewed on {new Date(submission.reviewedAt).toLocaleString()}
                        {submission.reviewer &&
                          ` by ${submission.reviewer.firstName ?? ''} ${submission.reviewer.lastName ?? ''}`.trim()}
                      </div>
                    )}

                    {/* Rejection Reason (if already rejected) */}
                    {submission.status === 'rejected' && submission.rejectionReason && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <span className="text-xs text-red-600 font-medium uppercase tracking-wide">
                          Rejection Reason
                        </span>
                        <p className="text-sm text-red-700 mt-1">
                          {submission.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons (only for pending) */}
                    {submission.status === 'pending' && (
                      <div className="pt-2">
                        {!isRejectMode ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(submission.id)}
                              disabled={reviewMutation.isPending}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              <FiCheckCircle className="text-base" />
                              {reviewMutation.isPending ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => setConfirmReject(submission.id)}
                              disabled={reviewMutation.isPending}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              <FiXCircle className="text-base" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rejection Reason
                              </label>
                              <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Provide a reason for rejection..."
                                rows={3}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(submission.id)}
                                disabled={
                                  !rejectionReason.trim() ||
                                  reviewMutation.isPending
                                }
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                <FiXCircle className="text-base" />
                                {reviewMutation.isPending
                                  ? 'Processing...'
                                  : 'Confirm Rejection'}
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmReject(null);
                                  setRejectionReason('');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} ({pagination?.total ?? 0} total)
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
