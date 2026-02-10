'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import type { KycVerification } from '@/types';
import {
  FiShield,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
  FiLoader,
  FiSend,
  FiFileText,
  FiChevronDown,
} from 'react-icons/fi';

/* -------- Constants -------- */
const KYC_LEVELS = [
  { value: 1, label: 'Level 1 - Basic' },
  { value: 2, label: 'Level 2 - Enhanced' },
  { value: 3, label: 'Level 3 - Full' },
];

const DOCUMENT_TYPES = [
  { value: 'CNIC', label: 'CNIC' },
  { value: 'Passport', label: 'Passport' },
  { value: 'Driver\'s License', label: 'Driver\'s License' },
];

/* -------- Schema -------- */
const kycSchema = z.object({
  kycLevel: z.coerce.number().min(1).max(3),
  documentType: z.string().min(1, 'Document type is required'),
  documentNumber: z.string().min(1, 'Document number is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

type KycFormData = z.infer<typeof kycSchema>;

/* -------- Status Badge -------- */
function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? 'unknown').toLowerCase();
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    verified: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: <FiCheckCircle className="text-sm" />,
    },
    approved: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: <FiCheckCircle className="text-sm" />,
    },
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      icon: <FiClock className="text-sm" />,
    },
    rejected: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: <FiXCircle className="text-sm" />,
    },
  };
  const c = config[s] ?? { bg: 'bg-gray-100', text: 'text-gray-600', icon: null };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}
    >
      {c.icon}
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

/* -------- KYC Level Label -------- */
function kycLevelLabel(level: number | null) {
  switch (level) {
    case 1:
      return 'Basic';
    case 2:
      return 'Enhanced';
    case 3:
      return 'Full';
    default:
      return 'None';
  }
}

/* -------- Skeleton -------- */
function StatusSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-100" />
        <div>
          <div className="h-5 w-36 bg-gray-100 rounded mb-1" />
          <div className="h-3 w-48 bg-gray-50 rounded" />
        </div>
      </div>
      <div className="h-20 bg-gray-50 rounded-lg" />
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="card animate-pulse space-y-4">
      <div className="h-5 w-48 bg-gray-100 rounded" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100" />
            <div>
              <div className="h-4 w-24 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-32 bg-gray-50 rounded" />
            </div>
          </div>
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* -------- Current Status Banner -------- */
function KycStatusBanner({
  kycStatus,
  kycLevel,
  submissions,
}: {
  kycStatus: string | null;
  kycLevel: number | null;
  submissions: KycVerification[];
}) {
  const status = (kycStatus ?? 'none').toLowerCase();

  // Find the last rejected submission for its reason
  const lastRejected = [...submissions]
    .reverse()
    .find((s) => (s.status ?? '').toLowerCase() === 'rejected');

  if (status === 'verified' || status === 'approved') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 flex items-start gap-3">
        <FiCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-800">
            KYC Verified - {kycLevelLabel(kycLevel)}
          </p>
          <p className="text-sm text-green-700 mt-0.5">
            Your identity has been verified. You have full access to all platform features at this level.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 flex items-start gap-3">
        <FiClock className="text-yellow-600 text-xl flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-yellow-800">
            Verification Pending
          </p>
          <p className="text-sm text-yellow-700 mt-0.5">
            Your KYC submission is under review. This usually takes 1-2 business days.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
        <FiXCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800">
            Verification Rejected
          </p>
          {lastRejected?.rejectionReason && (
            <p className="text-sm text-red-700 mt-0.5">
              Reason: {lastRejected.rejectionReason}
            </p>
          )}
          <p className="text-sm text-red-600 mt-1">
            Please submit a new KYC application with correct documents.
          </p>
        </div>
      </div>
    );
  }

  // No status / none
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 flex items-start gap-3">
      <FiAlertCircle className="text-gray-500 text-xl flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-gray-800">
          Verification Required
        </p>
        <p className="text-sm text-gray-600 mt-0.5">
          Complete your KYC verification to unlock all platform features.
        </p>
      </div>
    </div>
  );
}

/* -------- Submission Form -------- */
function KycSubmissionForm() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      kycLevel: 1,
      documentType: 'CNIC',
      documentNumber: '',
      expiryDate: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: KycFormData) =>
      api.submitKyc({
        kycLevel: data.kycLevel,
        documentType: data.documentType,
        documentData: {
          number: data.documentNumber,
          expiryDate: data.expiryDate,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      setFeedback({
        type: 'success',
        message: 'KYC submission successful! Your documents are now under review.',
      });
      reset();
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message:
          err?.response?.data?.message ??
          err?.message ??
          'Failed to submit KYC. Please try again.',
      });
    },
  });

  const onSubmit = (data: KycFormData) => {
    setFeedback(null);
    mutation.mutate(data);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-dao-blue/10 flex items-center justify-center text-dao-blue">
          <FiSend className="text-xl" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Submit KYC Verification
          </h2>
          <p className="text-sm text-gray-500">
            Provide your identity documents for verification.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 mb-4 ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <FiCheckCircle className="text-base flex-shrink-0" />
          ) : (
            <FiAlertCircle className="text-base flex-shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KYC Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              KYC Level
            </label>
            <div className="relative">
              <select
                {...register('kycLevel')}
                className={`w-full appearance-none border rounded-lg px-4 py-2.5 text-sm outline-none transition bg-white
                  ${errors.kycLevel ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue'}`}
              >
                {KYC_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {errors.kycLevel && (
              <p className="text-xs text-red-500 mt-1">{errors.kycLevel.message}</p>
            )}
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type
            </label>
            <div className="relative">
              <select
                {...register('documentType')}
                className={`w-full appearance-none border rounded-lg px-4 py-2.5 text-sm outline-none transition bg-white
                  ${errors.documentType ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue'}`}
              >
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {errors.documentType && (
              <p className="text-xs text-red-500 mt-1">{errors.documentType.message}</p>
            )}
          </div>

          {/* Document Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Number
            </label>
            <input
              type="text"
              placeholder="e.g. 42301-1234567-8"
              {...register('documentNumber')}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition
                ${errors.documentNumber ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue'}`}
            />
            {errors.documentNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.documentNumber.message}</p>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Expiry Date
            </label>
            <input
              type="date"
              {...register('expiryDate')}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition
                ${errors.expiryDate ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue'}`}
            />
            {errors.expiryDate && (
              <p className="text-xs text-red-500 mt-1">{errors.expiryDate.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-blue flex items-center gap-2 !px-5 !py-2.5 text-sm
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FiSend />
          )}
          {mutation.isPending ? 'Submitting...' : 'Submit KYC'}
        </button>
      </form>
    </div>
  );
}

/* -------- Submission History -------- */
function KycHistory({ submissions }: { submissions: KycVerification[] }) {
  if (!submissions.length) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Submission History
        </h2>
        <div className="text-center py-12 text-gray-400">
          <FiFileText className="mx-auto text-4xl mb-3" />
          <p className="text-sm">No KYC submissions yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Submit your first verification above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Submission History
      </h2>
      <div className="divide-y divide-gray-100">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                <FiFileText className="text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {sub.documentType ?? 'Unknown Document'}{' '}
                  <span className="text-gray-400 font-normal">
                    - Level {sub.kycLevel ?? '?'}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(sub.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
                {sub.rejectionReason && (
                  <p className="text-xs text-red-500 mt-0.5 truncate">
                    Reason: {sub.rejectionReason}
                  </p>
                )}
              </div>
            </div>
            <StatusBadge status={sub.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------- Main Page -------- */
export default function KycPage() {
  const { user } = useAuth();

  const {
    data: kycData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => api.getKycStatus(),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verify your identity to unlock all platform features.
        </p>
      </div>

      {/* Current Status */}
      {isLoading ? (
        <StatusSkeleton />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
          <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Failed to load KYC status
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              Please refresh the page or try again later.
            </p>
          </div>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dao-blue/10 flex items-center justify-center text-dao-blue">
              <FiShield className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Current Status
              </h2>
              <p className="text-sm text-gray-500">
                Level: {kycLevelLabel(kycData?.kycLevel ?? user?.kycLevel ?? null)}
              </p>
            </div>
          </div>
          <KycStatusBanner
            kycStatus={kycData?.kycStatus ?? user?.kycStatus ?? null}
            kycLevel={kycData?.kycLevel ?? user?.kycLevel ?? null}
            submissions={kycData?.submissions ?? []}
          />
        </div>
      )}

      {/* Submission Form */}
      <KycSubmissionForm />

      {/* History */}
      {isLoading ? (
        <HistorySkeleton />
      ) : (
        <KycHistory submissions={kycData?.submissions ?? []} />
      )}
    </div>
  );
}
