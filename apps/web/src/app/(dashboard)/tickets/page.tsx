'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import type { Ticket, TicketReply } from '@/types';
import {
  FiMessageSquare,
  FiPlus,
  FiX,
  FiLoader,
  FiSend,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiMessageCircle,
  FiInbox,
} from 'react-icons/fi';

/* -------- Constants -------- */
const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

/* -------- Schemas -------- */
const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().optional(),
  priority: z.string().optional(),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

const replySchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

type ReplyFormData = z.infer<typeof replySchema>;

/* -------- Badges -------- */
function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? 'open').toLowerCase();
  const styles: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-green-100 text-green-700',
    resolved: 'bg-green-100 text-green-700',
  };
  const icons: Record<string, React.ReactNode> = {
    open: <FiMessageCircle className="text-xs" />,
    in_progress: <FiClock className="text-xs" />,
    closed: <FiCheckCircle className="text-xs" />,
    resolved: <FiCheckCircle className="text-xs" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${styles[s] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {icons[s] ?? null}
      {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string | null }) {
  const p = (priority ?? 'medium').toLowerCase();
  const styles: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${styles[p] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {p.charAt(0).toUpperCase() + p.slice(1)}
    </span>
  );
}

/* -------- Skeleton -------- */
function TicketCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="h-5 w-48 bg-gray-100 rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
        </div>
      </div>
      <div className="h-4 w-64 bg-gray-50 rounded mb-3" />
      <div className="flex items-center gap-4">
        <div className="h-3 w-24 bg-gray-50 rounded" />
        <div className="h-3 w-20 bg-gray-50 rounded" />
      </div>
    </div>
  );
}

/* -------- Create Ticket Modal -------- */
function CreateTicketModal({ onClose }: { onClose: () => void }) {
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
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { title: '', description: '', priority: 'medium' },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateTicketFormData) =>
      api.createTicket({
        title: data.title,
        description: data.description || undefined,
        priority: data.priority || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setFeedback({ type: 'success', message: 'Ticket created successfully!' });
      reset();
      setTimeout(() => onClose(), 1200);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message:
          err?.response?.data?.message ??
          err?.message ??
          'Failed to create ticket. Please try again.',
      });
    },
  });

  const onSubmit = (data: CreateTicketFormData) => {
    setFeedback(null);
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Create New Ticket
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
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

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Brief summary of your issue"
              {...register('title')}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition
                ${errors.title ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue'}`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Provide details about your issue or question..."
              {...register('description')}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none transition
                         focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <div className="relative">
              <select
                {...register('priority')}
                className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none transition
                           focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue bg-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
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
              {mutation.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------- Ticket Detail / Replies -------- */
function TicketDetail({ ticketId }: { ticketId: number }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: ticket,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => api.getTicket(ticketId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: { message: '' },
  });

  const replyMutation = useMutation({
    mutationFn: (data: ReplyFormData) =>
      api.replyToTicket(ticketId, { message: data.message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      reset();
    },
  });

  const onSubmitReply = (data: ReplyFormData) => {
    replyMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="px-5 py-6 animate-pulse space-y-3">
        <div className="h-4 w-36 bg-gray-100 rounded" />
        <div className="h-16 bg-gray-50 rounded-lg" />
        <div className="h-16 bg-gray-50 rounded-lg" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="px-5 py-4">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <FiAlertCircle className="flex-shrink-0" />
          Failed to load ticket details.
        </div>
      </div>
    );
  }

  const replies = ticket.replies ?? [];
  const currentUserId = user?.id;

  return (
    <div className="border-t border-gray-100">
      {/* Description */}
      {ticket.description && (
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Description
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>
      )}

      {/* Replies */}
      <div className="px-5 py-4 space-y-3">
        {replies.length > 0 && (
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Conversation
          </p>
        )}

        {replies.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No replies yet. Send a message below.
          </p>
        )}

        {replies.map((reply: TicketReply) => {
          const isOwn = reply.userId === currentUserId;
          return (
            <div
              key={reply.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  isOwn
                    ? 'bg-dao-blue text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {!isOwn && reply.user && (
                  <p className="text-xs font-semibold mb-1 opacity-70">
                    {reply.user.firstName ?? ''} {reply.user.lastName ?? ''}
                    {' '}
                    <span className="font-normal">(Staff)</span>
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                <p
                  className={`text-[11px] mt-1 ${
                    isOwn ? 'text-blue-100' : 'text-gray-400'
                  }`}
                >
                  {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Form */}
      <form
        onSubmit={handleSubmit(onSubmitReply)}
        className="px-5 pb-5 flex gap-2"
      >
        <div className="flex-1">
          <textarea
            rows={2}
            placeholder="Type your reply..."
            {...register('message')}
            className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition resize-none
              ${errors.message ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-300 focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue'}`}
          />
          {errors.message && (
            <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
          )}
          {replyMutation.isError && (
            <p className="text-xs text-red-500 mt-1">
              Failed to send reply. Please try again.
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={replyMutation.isPending}
          className="self-end btn-blue !p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {replyMutation.isPending ? (
            <FiLoader className="animate-spin text-lg" />
          ) : (
            <FiSend className="text-lg" />
          )}
        </button>
      </form>
    </div>
  );
}

/* -------- Ticket Card -------- */
function TicketCard({ ticket }: { ticket: Ticket }) {
  const [expanded, setExpanded] = useState(false);
  const replyCount = ticket._count?.replies ?? ticket.replies?.length ?? 0;

  return (
    <div className="card !p-0 overflow-hidden">
      {/* Card Header - clickable */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left px-5 py-4 hover:bg-gray-50/50 transition"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
            {ticket.title}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <FiMessageSquare className="text-xs" />
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </span>
          {expanded ? (
            <FiChevronUp className="ml-auto text-gray-400" />
          ) : (
            <FiChevronDown className="ml-auto text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && <TicketDetail ticketId={ticket.id} />}
    </div>
  );
}

/* -------- Empty State -------- */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="card text-center py-16">
      <FiInbox className="mx-auto text-5xl text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-1">
        No support tickets
      </h3>
      <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
        Need help with something? Create a ticket and our support team will get
        back to you.
      </p>
      <button
        onClick={onCreateClick}
        className="btn-blue inline-flex items-center gap-2 !px-5 !py-2.5 text-sm"
      >
        <FiPlus />
        Create Your First Ticket
      </button>
    </div>
  );
}

/* -------- Pagination -------- */
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600
                   hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Previous
      </button>
      <span className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600
                   hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Next
      </button>
    </div>
  );
}

/* -------- Main Page -------- */
export default function TicketsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: ticketsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tickets', page],
    queryFn: () => api.getTickets({ page, limit }),
  });

  const tickets = ticketsData?.data ?? [];
  const pagination = ticketsData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Get help from our support team.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-blue flex items-center gap-2 !px-4 !py-2.5 text-sm"
        >
          <FiPlus />
          New Ticket
        </button>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
          <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Failed to load tickets
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              Please refresh the page or try again later.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <TicketCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && tickets.length === 0 && (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      )}

      {/* Tickets List */}
      {!isLoading && !isError && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map((ticket: Ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && tickets.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTicketModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
