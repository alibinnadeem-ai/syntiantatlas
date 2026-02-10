'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatDistanceToNow, format } from 'date-fns';
import {
  FiBell,
  FiCheckCircle,
  FiTrendingUp,
  FiShield,
  FiSettings,
  FiDollarSign,
  FiAlertCircle,
  FiInfo,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
} from 'react-icons/fi';
import type { Notification } from '@/types';

/* ─── Type-based Icon Mapping ─── */
function getNotificationIcon(type: string) {
  switch (type) {
    case 'investment':
      return (
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <FiTrendingUp className="text-dao-blue text-lg" />
        </div>
      );
    case 'kyc':
      return (
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
          <FiShield className="text-green-600 text-lg" />
        </div>
      );
    case 'transaction':
    case 'deposit':
    case 'withdrawal':
    case 'dividend':
      return (
        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
          <FiDollarSign className="text-purple-600 text-lg" />
        </div>
      );
    case 'system':
      return (
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <FiSettings className="text-gray-600 text-lg" />
        </div>
      );
    case 'alert':
    case 'warning':
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
          <FiAlertCircle className="text-yellow-600 text-lg" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <FiInfo className="text-dao-blue text-lg" />
        </div>
      );
  }
}

/* ─── Skeleton Loaders ─── */
function NotificationSkeleton() {
  return (
    <div className="card !p-0 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 px-6 py-5 border-b border-gray-50 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 w-1/3 bg-gray-100 rounded mb-2" />
            <div className="h-3 w-2/3 bg-gray-50 rounded mb-2" />
            <div className="h-2.5 w-20 bg-gray-50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Filter Tabs ─── */
type FilterTab = 'all' | 'unread';

/* ─── Main Notifications Page ─── */
export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();

  // Build query params
  const params: Record<string, string | number> = { page, limit };
  if (activeTab === 'unread') {
    params.unread = 1;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list', activeTab, page],
    queryFn: () => api.getNotifications(params),
  });

  const notifications: Notification[] = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0, limit: 10 };
  const currentPage =
    typeof pagination.page === 'string' ? parseInt(pagination.page as unknown as string) : pagination.page;
  const totalPages =
    typeof pagination.totalPages === 'string'
      ? parseInt(pagination.totalPages as unknown as string)
      : pagination.totalPages;

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated on your account activity and important alerts.
          </p>
        </div>
        <button
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
          className="btn-blue flex items-center gap-2 !px-4 !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiCheckCircle className="text-base" />
          {markAllReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
        </button>
      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-dao-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-dao-blue rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* ─── Notification List ─── */}
      {isLoading ? (
        <NotificationSkeleton />
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16">
          <FiInbox className="mx-auto text-5xl text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {activeTab === 'unread'
              ? 'No unread notifications.'
              : 'No notifications yet.'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === 'unread'
              ? 'You are all caught up!'
              : 'When you receive notifications, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          {notifications.map((notification, index) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full text-left flex items-start gap-4 px-6 py-5 transition-colors hover:bg-gray-50 ${
                index < notifications.length - 1 ? 'border-b border-gray-50' : ''
              } ${!notification.isRead ? 'border-l-[3px] border-l-dao-blue bg-dao-blue/[0.02]' : 'border-l-[3px] border-l-transparent'}`}
            >
              {/* Type Icon */}
              {getNotificationIcon(notification.type)}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={`text-sm leading-snug ${
                      !notification.isRead
                        ? 'font-semibold text-dao-dark'
                        : 'font-medium text-gray-700'
                    }`}
                  >
                    {notification.title}
                  </p>

                  {/* Unread dot */}
                  {!notification.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-dao-blue shrink-0 mt-1" />
                  )}
                </div>

                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {notification.message}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span className="text-xs text-gray-300">|</span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>
            </button>
          ))}

          {/* ─── Pagination ─── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
              <p className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-medium text-gray-700">
                  {(currentPage - 1) * pagination.limit + 1}
                </span>
                {' '}-{' '}
                <span className="font-medium text-gray-700">
                  {Math.min(currentPage * pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium text-gray-700">{pagination.total}</span>{' '}
                notifications
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700
                             border border-gray-300 rounded-lg hover:bg-gray-100 transition
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="text-sm" />
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                        pageNum === currentPage
                          ? 'bg-dao-blue text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700
                             border border-gray-300 rounded-lg hover:bg-gray-100 transition
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <FiChevronRight className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
