'use client';

import { useState } from 'react';
import {
  FiMessageSquare,
  FiClock,
  FiAlertCircle,
  FiSend,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUserCheck,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { Ticket, TicketReply } from '@/types';

type TabFilter = 'all' | 'assigned' | 'unassigned' | 'closed';

const priorityBadge: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusBadge: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

const statusOptions = ['open', 'in_progress', 'resolved', 'closed'];

export default function StaffTicketsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  const limit = 10;

  // Build query params based on active tab
  const queryParams: Record<string, string | number> = { page, limit };
  if (activeTab === 'assigned') {
    if (user?.id) queryParams.assignedTo = user.id;
  } else if (activeTab === 'unassigned') {
    queryParams.unassigned = 1;
  } else if (activeTab === 'closed') {
    queryParams.status = 'closed';
  }

  const {
    data: ticketsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['staff', 'tickets', activeTab, page],
    queryFn: () => api.getAdminTickets(queryParams),
  });

  // Fetch single ticket detail when selected
  const {
    data: ticketDetail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ['staff', 'ticket', selectedTicket?.id],
    queryFn: () => api.getAdminTicket(selectedTicket!.id),
    enabled: !!selectedTicket,
  });

  // Mutations
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status?: string; priority?: string; assignedTo?: number } }) =>
      api.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      api.adminReplyToTicket(id, { message }),
    onSuccess: () => {
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => api.closeTicket(id),
    onSuccess: () => {
      setSelectedTicket(null);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const tickets = ticketsData?.data ?? [];
  const pagination = ticketsData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedTicket(null);
  };

  const handleAssignToMe = (ticket: Ticket) => {
    if (!user?.id) return;
    updateTicketMutation.mutate({
      id: ticket.id,
      data: { assignedTo: user.id, status: 'in_progress' },
    });
  };

  const handleStatusUpdate = (ticketId: number) => {
    if (!statusUpdate) return;
    updateTicketMutation.mutate({
      id: ticketId,
      data: { status: statusUpdate },
    });
    setStatusUpdate('');
  };

  const handleReply = (ticketId: number) => {
    if (!replyMessage.trim()) return;
    replyMutation.mutate({ id: ticketId, message: replyMessage.trim() });
  };

  const handleClose = (ticketId: number) => {
    closeMutation.mutate(ticketId);
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'assigned', label: 'Assigned to Me' },
    { key: 'unassigned', label: 'Unassigned' },
    { key: 'closed', label: 'Closed' },
  ];

  // ── Ticket Detail Drawer ──
  if (selectedTicket) {
    const detail = ticketDetail ?? selectedTicket;
    const replies = detail.replies ?? [];

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => {
            setSelectedTicket(null);
            setReplyMessage('');
            setStatusUpdate('');
          }}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FiChevronLeft className="text-base" />
          Back to tickets
        </button>

        {/* Ticket Header */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-400">#{detail.id}</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    priorityBadge[detail.priority ?? 'low'] ?? priorityBadge.low
                  }`}
                >
                  {detail.priority ?? 'low'}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    statusBadge[detail.status ?? 'open'] ?? statusBadge.open
                  }`}
                >
                  {(detail.status ?? 'open').replace(/_/g, ' ')}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{detail.title}</h1>
              {detail.description && (
                <p className="text-gray-600 mt-2">{detail.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                <span>
                  Submitted by:{' '}
                  {detail.assignedByUser
                    ? `${detail.assignedByUser.firstName ?? ''} ${detail.assignedByUser.lastName ?? ''}`.trim() ||
                      detail.assignedByUser.email
                    : 'Unknown'}
                </span>
                <span>
                  Assigned to:{' '}
                  {detail.assignedToUser
                    ? `${detail.assignedToUser.firstName ?? ''} ${detail.assignedToUser.lastName ?? ''}`.trim() ||
                      detail.assignedToUser.email
                    : 'Unassigned'}
                </span>
                <span>
                  Created: {new Date(detail.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {detail.assignedTo !== user?.id && detail.status !== 'closed' && (
                <button
                  onClick={() => handleAssignToMe(detail)}
                  disabled={updateTicketMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-dao-blue text-white rounded-lg hover:bg-dao-blue/90 disabled:opacity-50 transition-colors"
                >
                  <FiUserCheck className="text-base" />
                  Assign to Me
                </button>
              )}
              {detail.status !== 'closed' && (
                <button
                  onClick={() => handleClose(detail.id)}
                  disabled={closeMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <FiXCircle className="text-base" />
                  Close Ticket
                </button>
              )}
            </div>
          </div>

          {/* Status Update */}
          {detail.status !== 'closed' && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <label className="text-sm text-gray-500 shrink-0">Update status:</label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
              >
                <option value="">Select status</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleStatusUpdate(detail.id)}
                disabled={!statusUpdate || updateTicketMutation.isPending}
                className="px-3 py-1.5 text-sm font-medium bg-dao-blue text-white rounded-lg hover:bg-dao-blue/90 disabled:opacity-50 transition-colors"
              >
                Update
              </button>
            </div>
          )}
        </div>

        {/* Replies */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Conversation {replies.length > 0 && `(${replies.length})`}
          </h2>

          {detailLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : replies.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No replies yet. Be the first to respond.
            </p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {replies.map((reply: TicketReply) => {
                const isMe = reply.userId === user?.id;
                return (
                  <div
                    key={reply.id}
                    className={`p-3 rounded-lg text-sm ${
                      isMe
                        ? 'bg-dao-blue/5 border border-dao-blue/10'
                        : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {reply.user
                          ? `${reply.user.firstName ?? ''} ${reply.user.lastName ?? ''}`.trim() ||
                            reply.user.email
                          : 'Unknown'}
                        {isMe && (
                          <span className="ml-1.5 text-xs text-dao-blue font-normal">
                            (You)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply Input */}
          {detail.status !== 'closed' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleReply(detail.id)}
                  disabled={!replyMessage.trim() || replyMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-dao-blue text-white rounded-lg hover:bg-dao-blue/90 disabled:opacity-50 transition-colors"
                >
                  <FiSend className="text-sm" />
                  {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main Tickets List ──
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ticket Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage and respond to support tickets.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
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
        <div className="card">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-3xl text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load tickets
          </h2>
          <p className="text-gray-500">
            Something went wrong. Please try refreshing the page.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && tickets.length === 0 && (
        <div className="card text-center py-12">
          <FiMessageSquare className="text-4xl text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No tickets found
          </h2>
          <p className="text-gray-500">
            {activeTab === 'assigned'
              ? 'You have no tickets assigned to you.'
              : activeTab === 'unassigned'
              ? 'All tickets have been assigned.'
              : activeTab === 'closed'
              ? 'No closed tickets yet.'
              : 'There are no tickets in the queue.'}
          </p>
        </div>
      )}

      {/* Tickets Table */}
      {!isLoading && !isError && tickets.length > 0 && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left font-medium text-gray-500 px-4 py-3">ID</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Title</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Submitter</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Priority</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Status</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket: Ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500">#{ticket.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px] truncate">
                    {ticket.title}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {ticket.assignedByUser
                      ? `${ticket.assignedByUser.firstName ?? ''} ${ticket.assignedByUser.lastName ?? ''}`.trim() ||
                        ticket.assignedByUser.email
                      : '--'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        priorityBadge[ticket.priority ?? 'low'] ?? priorityBadge.low
                      }`}
                    >
                      {ticket.priority ?? 'low'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        statusBadge[ticket.status ?? 'open'] ?? statusBadge.open
                      }`}
                    >
                      {(ticket.status ?? 'open').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <FiClock className="text-xs" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
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
