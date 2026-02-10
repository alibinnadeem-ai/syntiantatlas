'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiUsers,
  FiCheck,
  FiX,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiChevronDown,
  FiThumbsUp,
  FiThumbsDown,
  FiPlusCircle,
  FiFileText,
  FiInbox,
  FiArrowRight,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { GovernanceProposal, GovernanceVote } from '@/types';

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
    active: <FiClock className="text-xs" />,
    passed: <FiCheckCircle className="text-xs" />,
    executed: <FiCheckCircle className="text-xs" />,
    failed: <FiX className="text-xs" />,
    cancelled: <FiAlertCircle className="text-xs" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${styles[s] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {icons[s] ?? null}
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

/* -------- Vote Badge (For/Against) -------- */
function VoteBadge({ vote }: { vote: string }) {
  const isFor = vote.toLowerCase() === 'for';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
        isFor ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isFor ? <FiThumbsUp className="text-xs" /> : <FiThumbsDown className="text-xs" />}
      {isFor ? 'For' : 'Against'}
    </span>
  );
}

/* -------- Progress Bar -------- */
function ProgressBar({
  value,
  max,
  colorClass = 'bg-dao-blue',
  label,
}: {
  value: number;
  max: number;
  colorClass?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>{pct.toFixed(1)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* -------- Skeletons -------- */
function ProposalCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 w-32 bg-gray-100 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-2 w-full bg-gray-100 rounded-full" />
        <div className="h-2 w-full bg-gray-100 rounded-full" />
      </div>
      <div className="flex items-center gap-4 mt-4">
        <div className="h-3 w-24 bg-gray-50 rounded" />
        <div className="h-3 w-20 bg-gray-50 rounded" />
      </div>
    </div>
  );
}

function VoteCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 w-32 bg-gray-100 rounded mb-3" />
      <div className="flex items-center gap-4">
        <div className="h-3 w-24 bg-gray-50 rounded" />
        <div className="h-3 w-20 bg-gray-50 rounded" />
      </div>
    </div>
  );
}

/* -------- Proposal Card -------- */
function ProposalCard({ proposal }: { proposal: GovernanceProposal }) {
  const totalVotes = proposal.forVotes + proposal.againstVotes;
  const isActive = proposal.status.toLowerCase() === 'active';

  return (
    <Link href={`/governance/${proposal.id}`} className="block">
      <div className="card hover:shadow-md transition-shadow cursor-pointer border border-gray-100 hover:border-gray-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
            {proposal.title}
          </h3>
          <StatusBadge status={proposal.status} />
        </div>

        {/* Property */}
        <p className="text-xs text-gray-500 mb-4">
          Property: <span className="font-medium text-gray-700">{proposal.property.title}</span>
        </p>

        {/* Vote Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-600 font-medium flex items-center gap-1">
              <FiThumbsUp className="text-xs" /> For: {proposal.forVotes}
            </span>
            <span className="text-red-600 font-medium flex items-center gap-1">
              Against: {proposal.againstVotes} <FiThumbsDown className="text-xs" />
            </span>
          </div>
          {totalVotes > 0 ? (
            <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(proposal.forVotes / totalVotes) * 100}%` }}
              />
            </div>
          ) : (
            <div className="w-full bg-gray-100 rounded-full h-2" />
          )}
        </div>

        {/* Quorum */}
        <ProgressBar
          value={totalVotes}
          max={proposal.quorum}
          colorClass="bg-purple-500"
          label={`Quorum (${totalVotes} / ${proposal.quorum})`}
        />

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>
            {isActive ? getTimeRemaining(proposal.votingEndsAt) : `Ended ${formatDate(proposal.votingEndsAt)}`}
          </span>
          <span className="flex items-center gap-1 text-dao-blue font-medium">
            View Details <FiArrowRight className="text-xs" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* -------- All Proposals Tab -------- */
function AllProposalsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: proposals, isLoading, isError } = useQuery({
    queryKey: ['governance-proposals', statusFilter],
    queryFn: () =>
      api.getGovernanceProposals(
        statusFilter !== 'all' ? { status: statusFilter } : undefined,
      ),
  });

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'passed', label: 'Passed' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              statusFilter === f.value
                ? 'bg-dao-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
          <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Failed to load proposals</p>
            <p className="text-sm text-red-600 mt-0.5">Please refresh the page or try again later.</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProposalCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && (!proposals || proposals.length === 0) && (
        <div className="card text-center py-16">
          <FiInbox className="mx-auto text-5xl text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No proposals found</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            {statusFilter !== 'all'
              ? `There are no ${statusFilter} proposals at the moment.`
              : 'No governance proposals have been created yet. Be the first to create one!'}
          </p>
        </div>
      )}

      {/* Proposals Grid */}
      {!isLoading && !isError && proposals && proposals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((proposal: GovernanceProposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------- My Votes Tab -------- */
function MyVotesTab() {
  const { data: votes, isLoading, isError } = useQuery({
    queryKey: ['my-governance-votes'],
    queryFn: () => api.getMyGovernanceVotes(),
  });

  return (
    <div className="space-y-6">
      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
          <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Failed to load your votes</p>
            <p className="text-sm text-red-600 mt-0.5">Please refresh the page or try again later.</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <VoteCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && (!votes || votes.length === 0) && (
        <div className="card text-center py-16">
          <FiFileText className="mx-auto text-5xl text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No votes yet</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            You haven&apos;t voted on any proposals yet. Browse active proposals to participate in governance.
          </p>
        </div>
      )}

      {/* Votes List */}
      {!isLoading && !isError && votes && votes.length > 0 && (
        <div className="space-y-4">
          {votes.map((v: GovernanceVote) => (
            <Link key={v.proposalId} href={`/governance/${v.proposalId}`} className="block">
              <div className="card hover:shadow-md transition-shadow cursor-pointer border border-gray-100 hover:border-gray-200">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {v.proposal.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <VoteBadge vote={v.vote} />
                    <StatusBadge status={v.proposal.status} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Property: <span className="font-medium text-gray-700">{v.proposal.property.title}</span>
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Vote Weight: <span className="font-semibold text-gray-700">{v.weight}</span></span>
                  <span>Voted on {formatDateTime(v.votedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------- Create Proposal Tab -------- */
function CreateProposalTab({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyId, setPropertyId] = useState<number | ''>('');

  // Fetch user's portfolio to get their investments (properties they can create proposals for)
  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.getPortfolio(),
  });

  const investments = portfolio?.investments ?? [];

  const mutation = useMutation({
    mutationFn: (data: { propertyId: number; title: string; description: string }) =>
      api.createGovernanceProposal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-proposals'] });
      setFeedback({ type: 'success', message: 'Proposal created successfully! It is now open for voting.' });
      setTitle('');
      setDescription('');
      setPropertyId('');
      setTimeout(() => onSuccess(), 1500);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message:
          err?.response?.data?.message ??
          err?.message ??
          'Failed to create proposal. Please try again.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!propertyId || !title.trim() || !description.trim()) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    mutation.mutate({
      propertyId: Number(propertyId),
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Create a Governance Proposal</h3>
        <p className="text-sm text-gray-500 mb-6">
          Submit a proposal for a property you have invested in. Other token holders will be able to vote on it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Feedback */}
          {feedback && (
            <div
              className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
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

          {/* Property Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property <span className="text-red-400">*</span>
            </label>
            {portfolioLoading ? (
              <div className="h-11 bg-gray-100 rounded-lg animate-pulse" />
            ) : investments.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                You must have investments in a property to create a proposal.
                <Link href="/properties" className="text-dao-blue font-medium ml-1 hover:underline">
                  Browse properties
                </Link>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none transition
                             focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue bg-white"
                >
                  <option value="">Select a property...</option>
                  {investments.map((inv: any) => (
                    <option key={inv.property?.id ?? inv.propertyId} value={inv.property?.id ?? inv.propertyId}>
                      {inv.property?.title ?? `Property #${inv.propertyId}`}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposal Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Approve renovation budget for Q2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none transition
                         focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Describe your proposal in detail. Include the rationale, expected outcomes, and any relevant data..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none transition
                         focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending || investments.length === 0}
              className="btn-blue flex items-center gap-2 !px-5 !py-2.5 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiPlusCircle />
              )}
              {mutation.isPending ? 'Creating...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------- Tab Navigation -------- */
type TabKey = 'proposals' | 'my-votes' | 'create';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'proposals', label: 'All Proposals', icon: <FiFileText /> },
  { key: 'my-votes', label: 'My Votes', icon: <FiCheck /> },
  { key: 'create', label: 'Create Proposal', icon: <FiPlusCircle /> },
];

/* -------- Main Page -------- */
export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('proposals');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-dao-blue/10 rounded-lg flex items-center justify-center">
            <FiUsers className="text-dao-blue text-lg" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Syntiant Governance</h1>
          </div>
        </div>
        <p className="mt-2 text-gray-600">
          Participate in property decisions through token-weighted voting
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-dao-blue text-dao-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'proposals' && <AllProposalsTab />}
      {activeTab === 'my-votes' && <MyVotesTab />}
      {activeTab === 'create' && (
        <CreateProposalTab onSuccess={() => setActiveTab('proposals')} />
      )}
    </div>
  );
}
