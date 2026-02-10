'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiShield,
  FiEye,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiFileText,
  FiClock,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';
import type { KycVerification } from '@/types';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Level 1 - Basic',
  2: 'Level 2 - Enhanced',
  3: 'Level 3 - Full',
};

export default function AdminKycPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [reviewModal, setReviewModal] = useState<KycVerification | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: kycData, isLoading, isError } = useQuery({
    queryKey: ['admin', 'kyc', page, statusFilter],
    queryFn: () =>
      api.getKycSubmissions({
        page,
        limit: 10,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) =>
      api.reviewKyc(id, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] });
      closeReviewModal();
    },
  });

  const submissions = kycData?.data ?? [];
  const pagination = kycData?.pagination;

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const closeReviewModal = () => {
    setReviewModal(null);
    setRejecting(false);
    setRejectionReason('');
    reviewMutation.reset();
  };

  const handleApprove = () => {
    if (!reviewModal) return;
    reviewMutation.mutate({ id: reviewModal.id, status: 'approved' });
  };

  const handleReject = () => {
    if (!reviewModal || !rejectionReason.trim()) return;
    reviewMutation.mutate({
      id: reviewModal.id,
      status: 'rejected',
      rejectionReason: rejectionReason.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and process identity verification requests.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              statusFilter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KYC Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Document Type</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">KYC Level</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Submitted</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-dao-blue border-t-transparent rounded-full animate-spin" />
                      Loading KYC submissions...
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-red-500 mb-2">Failed to load KYC submissions.</div>
                    <button
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] })}
                      className="text-sm text-dao-blue hover:underline"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FiShield className="text-xl text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No submissions found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {statusFilter !== 'all'
                        ? `No ${statusFilter} KYC submissions.`
                        : 'There are no KYC submissions yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <FiUser className="text-gray-500 text-sm" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {submission.user?.firstName && submission.user?.lastName
                              ? `${submission.user.firstName} ${submission.user.lastName}`
                              : 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {submission.user?.email || `User #${submission.userId}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <FiFileText className="text-gray-400" />
                        <span className="text-gray-700 capitalize">
                          {submission.documentType?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">
                        {submission.kycLevel
                          ? LEVEL_LABELS[submission.kycLevel] || `Level ${submission.kycLevel}`
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[submission.status || ''] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {submission.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <FiClock className="text-gray-400 text-xs" />
                        {format(new Date(submission.createdAt), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setReviewModal(submission)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-dao-blue bg-dao-blue/5 rounded-lg hover:bg-dao-blue/10 transition-colors"
                      >
                        <FiEye className="text-sm" /> Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} submissions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronLeft />
              </button>
              <span className="text-sm text-gray-600 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Review KYC Submission
              </h2>
              <button
                onClick={closeReviewModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-xl text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {reviewModal.user?.firstName && reviewModal.user?.lastName
                      ? `${reviewModal.user.firstName} ${reviewModal.user.lastName}`
                      : 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-500">{reviewModal.user?.email || `User #${reviewModal.userId}`}</p>
                </div>
                <div className="ml-auto">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      STATUS_COLORS[reviewModal.status || ''] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {reviewModal.status || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Submission Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Document Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {reviewModal.documentType?.replace(/_/g, ' ') || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">KYC Level</p>
                  <p className="text-sm font-medium text-gray-900">
                    {reviewModal.kycLevel
                      ? LEVEL_LABELS[reviewModal.kycLevel] || `Level ${reviewModal.kycLevel}`
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Submitted On</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(reviewModal.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Submission ID</p>
                  <p className="text-sm font-medium text-gray-900">#{reviewModal.id}</p>
                </div>
              </div>

              {/* Reviewer Info (if already reviewed) */}
              {reviewModal.reviewedAt && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Reviewed By</p>
                  <p className="text-sm font-medium text-gray-900">
                    {reviewModal.reviewer
                      ? `${reviewModal.reviewer.firstName || ''} ${reviewModal.reviewer.lastName || ''}`.trim() || `Reviewer #${reviewModal.reviewedBy}`
                      : `Reviewer #${reviewModal.reviewedBy}`}
                    {' '}on {format(new Date(reviewModal.reviewedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}

              {/* Existing Rejection Reason */}
              {reviewModal.status === 'rejected' && reviewModal.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-red-600 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-800">{reviewModal.rejectionReason}</p>
                </div>
              )}

              {/* Document Data */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Document Data</p>
                <div className="bg-dao-dark rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
                    {reviewModal.documentData
                      ? JSON.stringify(reviewModal.documentData, null, 2)
                      : 'No document data provided.'}
                  </pre>
                </div>
              </div>

              {/* Rejection Reason Input */}
              {rejecting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejecting this KYC submission..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
                  />
                </div>
              )}

              {/* Mutation Error */}
              {reviewMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  Failed to process KYC review. Please try again.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {reviewModal.status === 'pending' && (
              <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
                {rejecting ? (
                  <>
                    <button
                      onClick={() => {
                        setRejecting(false);
                        setRejectionReason('');
                      }}
                      className="btn-secondary flex-1 !py-2.5 text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={!rejectionReason.trim() || reviewMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reviewMutation.isPending ? 'Rejecting...' : (
                        <>
                          <FiX /> Confirm Rejection
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={closeReviewModal}
                      className="btn-secondary flex-1 !py-2.5 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setRejecting(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <FiX /> Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={reviewMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {reviewMutation.isPending ? 'Approving...' : (
                        <>
                          <FiCheck /> Approve
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Close button for already-reviewed submissions */}
            {reviewModal.status !== 'pending' && (
              <div className="px-6 py-4 border-t border-gray-100">
                <button
                  onClick={closeReviewModal}
                  className="btn-blue w-full !py-2.5 text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
