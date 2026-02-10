'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiEye,
  FiSend,
  FiMessageSquare,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiInbox,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';
import type { Ticket, TicketReply } from '@/types';

// ── colour maps ──────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

// ── helpers ──────────────────────────────────────────────────────────────
function userName(user?: { firstName: string | null; lastName: string | null; email: string } | null): string {
  if (!user) return '--';
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return user.email;
}

// ── main page ────────────────────────────────────────────────────────────
export default function AdminTicketsPage() {
  const queryClient = useQueryClient();

  // filters & pagination
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // detail modal
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [modalStatus, setModalStatus] = useState('');
  const [modalPriority, setModalPriority] = useState('');
  const repliesEndRef = useRef<HTMLDivElement>(null);

  // ── queries ────────────────────────────────────────────────────────────
  const { data: ticketsData, isLoading, isError } = useQuery({
    queryKey: ['admin', 'tickets', page, statusFilter, priorityFilter],
    queryFn: () =>
      api.getAdminTickets({
        page,
        limit: 10,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
      }),
  });

  const { data: ticketDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'ticket', selectedTicketId],
    queryFn: () => api.getAdminTicket(selectedTicketId!),
    enabled: selectedTicketId !== null,
  });

  // keep modal dropdowns in sync when detail loads
  useEffect(() => {
    if (ticketDetail) {
      setModalStatus(ticketDetail.status || '');
      setModalPriority(ticketDetail.priority || '');
    }
  }, [ticketDetail]);

  // auto-scroll replies
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketDetail?.replies]);

  // ── mutations ──────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status?: string; priority?: string } }) =>
      api.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'ticket', selectedTicketId] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      api.adminReplyToTicket(id, { message }),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'ticket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => api.closeTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'ticket', selectedTicketId] });
    },
  });

  // ── derived data ───────────────────────────────────────────────────────
  const tickets = ticketsData?.data ?? [];
  const pagination = ticketsData?.pagination;

  // summary counts (computed from current page data when no filters, from the
  // full list query otherwise -- best-effort client-side counts)
  const allTickets = tickets;
  const totalCount = pagination?.total ?? 0;
  const openCount = allTickets.filter((t) => t.status === 'open' || t.status === 'pending').length;
  const inProgressCount = allTickets.filter((t) => t.status === 'in_progress').length;
  const closedCount = allTickets.filter((t) => t.status === 'closed' || t.status === 'resolved').length;

  // ── handlers ───────────────────────────────────────────────────────────
  const openDetail = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setReplyText('');
  };

  const closeModal = () => {
    setSelectedTicketId(null);
    setReplyText('');
    setModalStatus('');
    setModalPriority('');
  };

  const handleReply = () => {
    if (!replyText.trim() || !selectedTicketId) return;
    replyMutation.mutate({ id: selectedTicketId, message: replyText.trim() });
  };

  const handleStatusChange = (value: string) => {
    setModalStatus(value);
    if (selectedTicketId) {
      updateMutation.mutate({ id: selectedTicketId, data: { status: value } });
    }
  };

  const handlePriorityChange = (value: string) => {
    setModalPriority(value);
    if (selectedTicketId) {
      updateMutation.mutate({ id: selectedTicketId, data: { priority: value } });
    }
  };

  const handleClose = () => {
    if (!selectedTicketId) return;
    closeMutation.mutate(selectedTicketId);
  };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage support tickets submitted by users.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Tickets" value={totalCount} icon={<FiInbox />} color="text-dao-blue" bg="bg-dao-blue/10" />
        <SummaryCard label="Open / Pending" value={openCount} icon={<FiAlertCircle />} color="text-yellow-600" bg="bg-yellow-50" />
        <SummaryCard label="In Progress" value={inProgressCount} icon={<FiClock />} color="text-indigo-600" bg="bg-indigo-50" />
        <SummaryCard label="Resolved / Closed" value={closedCount} icon={<FiCheckCircle />} color="text-green-600" bg="bg-green-50" />
      </div>

      {/* Filter Bar */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiFilter className="text-gray-400" />
            <span className="font-medium">Filters</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue bg-white"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">ID</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Submitter</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Priority</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-center px-6 py-3 font-medium text-gray-500">Replies</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Created</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-dao-blue border-t-transparent rounded-full animate-spin" />
                      Loading tickets...
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-red-500 font-medium mb-1">Failed to load tickets</div>
                    <p className="text-sm text-gray-400">Please try refreshing the page.</p>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FiInbox className="text-3xl text-gray-300" />
                      <span>No tickets found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => openDetail(ticket)}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">#{ticket.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 max-w-[220px] truncate">
                      {ticket.title}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {userName(ticket.assignedByUser)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          PRIORITY_COLORS[ticket.priority || ''] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ticket.priority || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[ticket.status || ''] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ticket.status?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <FiMessageSquare className="text-xs" />
                        {ticket._count?.replies ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(ticket);
                        }}
                        className="inline-flex items-center gap-1 text-dao-blue hover:text-dao-blue/80 text-xs font-medium transition-colors"
                      >
                        <FiEye /> View
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
              {pagination.total} tickets
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

      {/* ── Ticket Detail Modal ───────────────────────────────────────── */}
      {selectedTicketId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
                {detailLoading ? 'Loading...' : `Ticket #${ticketDetail?.id} - ${ticketDetail?.title}`}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-5 h-5 border-2 border-dao-blue border-t-transparent rounded-full animate-spin" />
                  Loading ticket details...
                </div>
              </div>
            ) : !ticketDetail ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <p className="text-gray-400">Ticket not found.</p>
              </div>
            ) : (
              <>
                {/* Ticket Info */}
                <div className="px-6 py-4 border-b border-gray-100 space-y-3 shrink-0">
                  {/* Meta row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Submitter:</span>{' '}
                      <span className="text-gray-700 font-medium">{userName(ticketDetail.assignedByUser)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Assigned To:</span>{' '}
                      <span className="text-gray-700 font-medium">{userName(ticketDetail.assignedToUser)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Created:</span>{' '}
                      <span className="text-gray-700">{format(new Date(ticketDetail.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    {ticketDetail.dueDate && (
                      <div>
                        <span className="text-gray-400">Due:</span>{' '}
                        <span className="text-gray-700">{format(new Date(ticketDetail.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {ticketDetail.completedAt && (
                      <div>
                        <span className="text-gray-400">Completed:</span>{' '}
                        <span className="text-gray-700">{format(new Date(ticketDetail.completedAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {ticketDetail.description && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                      {ticketDetail.description}
                    </div>
                  )}

                  {/* Controls row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-500">Status</label>
                      <select
                        value={modalStatus}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updateMutation.isPending}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue bg-white disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-500">Priority</label>
                      <select
                        value={modalPriority}
                        onChange={(e) => handlePriorityChange(e.target.value)}
                        disabled={updateMutation.isPending}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue bg-white disabled:opacity-50"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    {ticketDetail.status !== 'closed' && (
                      <button
                        onClick={handleClose}
                        disabled={closeMutation.isPending}
                        className="ml-auto px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {closeMutation.isPending ? 'Closing...' : 'Close Ticket'}
                      </button>
                    )}
                  </div>

                  {/* Mutation error */}
                  {(updateMutation.isError || closeMutation.isError) && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                      An error occurred. Please try again.
                    </div>
                  )}
                </div>

                {/* Replies */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
                  {(!ticketDetail.replies || ticketDetail.replies.length === 0) ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <FiMessageSquare className="text-2xl mx-auto mb-2 text-gray-300" />
                      No replies yet. Start the conversation below.
                    </div>
                  ) : (
                    ticketDetail.replies.map((reply: TicketReply) => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-dao-blue/10 text-dao-blue flex items-center justify-center text-xs font-semibold shrink-0">
                          {reply.user?.firstName?.[0]?.toUpperCase() || reply.user?.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {userName(reply.user)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(new Date(reply.createdAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">
                            {reply.message}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={repliesEndRef} />
                </div>

                {/* Reply Input */}
                <div className="px-6 py-4 border-t border-gray-100 shrink-0">
                  {replyMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">
                      Failed to send reply. Please try again.
                    </div>
                  )}
                  <div className="flex gap-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleReply();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue resize-none"
                    />
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim() || replyMutation.isPending}
                      className="self-end px-4 py-2.5 bg-dao-blue text-white rounded-lg hover:bg-dao-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium shrink-0"
                    >
                      {replyMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiSend />
                      )}
                      Send
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Press Cmd+Enter or Ctrl+Enter to send</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Summary Card Component ────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg ${bg} flex items-center justify-center ${color} text-xl shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
