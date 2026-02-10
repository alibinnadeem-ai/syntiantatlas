'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiArrowLeft,
  FiUsers,
  FiThumbsUp,
  FiThumbsDown,
  FiClock,
  FiCheckCircle,
  FiX,
  FiAlertCircle,
  FiLoader,
  FiUser,
  FiCalendar,
  FiHome,
  FiSlash,
  FiPlay,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { GovernanceProposal } from '@/types';

/* -------- Helpers -------- */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimeRemaining(endDateStr: string): string {
  const now = new Date();
  const end = new Date(endDateStr);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Voting ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

/* -------- Status Badge -------- */
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const styles: Record<string, string> = {
    active: 'bg-blue-100 text-blue-700',
    passed: 'bg-green-100 text-green-700',
    executed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
  };
  const icons: Record<string, React.ReactNode> = {
    active: <FiClock className="text-sm" />,
    passed: <FiCheckCircle className="text-sm" />,
    executed: <FiCheckCircle className="text-sm" />,
    failed: <FiX className="text-sm" />,
    cancelled: <FiAlertCircle className="text-sm" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${styles[s] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {icons[s] ?? null}
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

/* -------- Progress Bar -------- */
function ProgressBar({
  value,
  max,
  colorClass = 'bg-dao-blue',
  height = 'h-3',
}: {
  value: number;
  max: number;
  colorClass?: string;
  height?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={`w-full bg-gray-100 rounded-full ${height} overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* -------- Skeleton -------- */
function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-8 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/3 bg-gray-100 rounded" />
      </div>
      <div className="card space-y-4">
        <div className="h-5 w-1/4 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-100 rounded-full" />
        <div className="h-3 w-full bg-gray-100 rounded-full" />
      </div>
      <div className="card space-y-4">
        <div className="h-5 w-1/4 bg-gray-200 rounded" />
        <div className="h-20 w-full bg-gray-100 rounded" />
      </div>
    </div>
  );
}

/* -------- Main Page -------- */
export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const proposalId = Number(params.id);

  const [voteFeedback, setVoteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: proposal, isLoading, isError } = useQuery({
    queryKey: ['governance-proposal', proposalId],
    queryFn: () => api.getGovernanceProposal(proposalId),
    enabled: !isNaN(proposalId),
  });

  const voteMutation = useMutation({
    mutationFn: (vote: string) => api.castGovernanceVote(proposalId, { vote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-proposal', proposalId] });
      queryClient.invalidateQueries({ queryKey: ['governance-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['my-governance-votes'] });
      setVoteFeedback({ type: 'success', message: 'Your vote has been cast successfully!' });
    },
    onError: (err: any) => {
      setVoteFeedback({
        type: 'error',
        message: err?.response?.data?.message ?? err?.message ?? 'Failed to cast vote. Please try again.',
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: () => api.executeProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-proposal', proposalId] });
      queryClient.invalidateQueries({ queryKey: ['governance-proposals'] });
      setActionFeedback({ type: 'success', message: 'Proposal has been executed successfully.' });
    },
    onError: (err: any) => {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message ?? err?.message ?? 'Failed to execute proposal.',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-proposal', proposalId] });
      queryClient.invalidateQueries({ queryKey: ['governance-proposals'] });
      setActionFeedback({ type: 'success', message: 'Proposal has been cancelled.' });
    },
    onError: (err: any) => {
      setActionFeedback({
        type: 'error',
        message: err?.response?.data?.message ?? err?.message ?? 'Failed to cancel proposal.',
      });
    },
  });

  // Loading state
  if (isLoading) return <DetailSkeleton />;

  // Error state
  if (isError || !proposal) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/governance" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          <FiArrowLeft /> Back to Governance
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
          <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Failed to load proposal</p>
            <p className="text-sm text-red-600 mt-0.5">
              The proposal may not exist or there was a server error. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalVotes = proposal.forVotes + proposal.againstVotes;
  const isActive = proposal.status.toLowerCase() === 'active';
  const isPassed = proposal.status.toLowerCase() === 'passed';
  const canVote = isActive && !proposal.hasVoted;
  const isProposer = user?.id === proposal.proposer.id;
  const isAdmin = user?.roleId === 'admin' || user?.roleId === 'operations_manager';
  const canExecute = isPassed && (isAdmin || isProposer);
  const canCancel = isActive && (isAdmin || isProposer);
  const forPct = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
  const againstPct = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;
  const quorumPct = proposal.quorum > 0 ? Math.min((totalVotes / proposal.quorum) * 100, 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back Link */}
      <Link
        href="/governance"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <FiArrowLeft /> Back to Governance
      </Link>

      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <FiHome className="text-gray-400" />
                {proposal.property.title}
              </span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1.5">
                <FiUser className="text-gray-400" />
                {proposal.proposer.firstName ?? ''} {proposal.proposer.lastName ?? ''}{' '}
                <span className="text-gray-400">({proposal.proposer.email})</span>
              </span>
            </div>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FiCalendar className="text-gray-400" />
            Created {formatDate(proposal.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <FiClock className="text-gray-400" />
            {isActive ? getTimeRemaining(proposal.votingEndsAt) : `Voting ended ${formatDate(proposal.votingEndsAt)}`}
          </span>
        </div>
      </div>

      {/* Action Feedback */}
      {actionFeedback && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
            actionFeedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <FiCheckCircle className="text-base flex-shrink-0" />
          ) : (
            <FiAlertCircle className="text-base flex-shrink-0" />
          )}
          {actionFeedback.message}
        </div>
      )}

      {/* Vote Results */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Voting Results</h2>

        {/* For vs Against */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          {/* For */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                <FiThumbsUp /> For
              </span>
              <span className="text-green-800 font-bold text-xl">{proposal.forVotes}</span>
            </div>
            <ProgressBar value={proposal.forVotes} max={totalVotes || 1} colorClass="bg-green-500" />
            <p className="text-xs text-green-600 mt-2 text-right">{forPct.toFixed(1)}%</p>
          </div>

          {/* Against */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                <FiThumbsDown /> Against
              </span>
              <span className="text-red-800 font-bold text-xl">{proposal.againstVotes}</span>
            </div>
            <ProgressBar value={proposal.againstVotes} max={totalVotes || 1} colorClass="bg-red-500" />
            <p className="text-xs text-red-600 mt-2 text-right">{againstPct.toFixed(1)}%</p>
          </div>
        </div>

        {/* Quorum Progress */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
              <FiUsers /> Quorum Progress
            </span>
            <span className="text-gray-800 font-bold">
              {totalVotes} / {proposal.quorum}
            </span>
          </div>
          <ProgressBar value={totalVotes} max={proposal.quorum} colorClass="bg-purple-500" height="h-3" />
          <p className="text-xs text-gray-500 mt-2 text-right">
            {quorumPct.toFixed(1)}% of quorum reached
          </p>
        </div>

        {/* User's vote indicator */}
        {proposal.hasVoted && (
          <div className="mt-4 bg-dao-blue/5 border border-dao-blue/20 rounded-xl p-4 flex items-center gap-3">
            <FiCheckCircle className="text-dao-blue text-lg flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                You voted <span className={proposal.userVote?.toLowerCase() === 'for' ? 'text-green-700' : 'text-red-700'}>{proposal.userVote?.toLowerCase() === 'for' ? 'For' : 'Against'}</span> this proposal
              </p>
              {proposal.userVoteWeight !== undefined && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Vote weight: {proposal.userVoteWeight}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposal Description</h2>
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {proposal.description}
        </div>
      </div>

      {/* Cast Your Vote */}
      {canVote && (
        <div className="card border-2 border-dao-blue/20 bg-dao-blue/5">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cast Your Vote</h2>
          <p className="text-sm text-gray-600 mb-6">
            Your vote is weighted by your token holdings in this property. This action cannot be undone.
          </p>

          {/* Vote Feedback */}
          {voteFeedback && (
            <div
              className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 mb-4 ${
                voteFeedback.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {voteFeedback.type === 'success' ? (
                <FiCheckCircle className="text-base flex-shrink-0" />
              ) : (
                <FiAlertCircle className="text-base flex-shrink-0" />
              )}
              {voteFeedback.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                setVoteFeedback(null);
                voteMutation.mutate('for');
              }}
              disabled={voteMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {voteMutation.isPending ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiThumbsUp />
              )}
              Vote For
            </button>
            <button
              onClick={() => {
                setVoteFeedback(null);
                voteMutation.mutate('against');
              }}
              disabled={voteMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {voteMutation.isPending ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiThumbsDown />
              )}
              Vote Against
            </button>
          </div>
        </div>
      )}

      {/* Admin / Proposer Actions */}
      {(canExecute || canCancel) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {canExecute && (
              <button
                onClick={() => {
                  setActionFeedback(null);
                  executeMutation.mutate();
                }}
                disabled={executeMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executeMutation.isPending ? <FiLoader className="animate-spin" /> : <FiPlay />}
                {executeMutation.isPending ? 'Executing...' : 'Execute Proposal'}
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => {
                  setActionFeedback(null);
                  cancelMutation.mutate();
                }}
                disabled={cancelMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelMutation.isPending ? <FiLoader className="animate-spin" /> : <FiSlash />}
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Proposal'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Proposal Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposal Details</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <FiUser className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Proposer</p>
              <p className="font-medium text-gray-800 mt-0.5">
                {proposal.proposer.firstName ?? ''} {proposal.proposer.lastName ?? ''}
              </p>
              <p className="text-xs text-gray-500">{proposal.proposer.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <FiHome className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Property</p>
              <p className="font-medium text-gray-800 mt-0.5">{proposal.property.title}</p>
              <Link
                href={`/properties/${proposal.propertyId}`}
                className="text-xs text-dao-blue hover:underline"
              >
                View property
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <FiCalendar className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Created</p>
              <p className="font-medium text-gray-800 mt-0.5">{formatDateTime(proposal.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <FiClock className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Voting Ends</p>
              <p className="font-medium text-gray-800 mt-0.5">{formatDateTime(proposal.votingEndsAt)}</p>
              {isActive && (
                <p className="text-xs text-blue-600 mt-0.5">{getTimeRemaining(proposal.votingEndsAt)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
