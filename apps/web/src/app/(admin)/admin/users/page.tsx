'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiSearch, FiPlus, FiX, FiChevronLeft, FiChevronRight, FiEye } from 'react-icons/fi';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';

const createStaffSchema = z.object({
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  roleId: z.enum(['staff', 'operations_manager'], {
    required_error: 'Role is required',
  }),
});

type CreateStaffForm = z.infer<typeof createStaffSchema>;

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  investor: 'bg-blue-100 text-blue-700',
  seller: 'bg-green-100 text-green-700',
  staff: 'bg-purple-100 text-purple-700',
  operations_manager: 'bg-purple-100 text-purple-700',
};

const KYC_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  deactivated: 'bg-red-100 text-red-700',
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [createdStaff, setCreatedStaff] = useState<{
    employeeId: string;
    temporaryPassword: string;
    email: string;
  } | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, roleFilter, statusFilter],
    queryFn: () =>
      api.getUsers({
        page,
        limit: 10,
        ...(search ? { search } : {}),
        ...(roleFilter ? { roleId: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStaffForm>({
    resolver: zodResolver(createStaffSchema),
  });

  const createStaffMutation = useMutation({
    mutationFn: (data: CreateStaffForm) => api.createStaff(data),
    onSuccess: (result) => {
      setCreatedStaff({
        employeeId: result.employeeId,
        temporaryPassword: result.temporaryPassword,
        email: result.email,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      reset();
    },
  });

  const users = usersData?.data ?? [];
  const pagination = usersData?.pagination;

  const closeModal = () => {
    setModalOpen(false);
    setCreatedStaff(null);
    reset();
    createStaffMutation.reset();
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage platform users and create staff accounts.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-blue flex items-center gap-2 !py-2.5 !px-4 text-sm w-fit"
        >
          <FiPlus /> Create Staff
        </button>
      </div>

      {/* Search & Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue bg-white"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="investor">Investor</option>
            <option value="seller">Seller</option>
            <option value="staff">Staff</option>
            <option value="operations_manager">Operations Manager</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">KYC Status</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Wallet Balance</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Created At</th>
                <th className="text-center px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-dao-blue border-t-transparent rounded-full animate-spin" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : '--'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          ROLE_COLORS[user.roleId || ''] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.roleId?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[user.status || 'active'] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          KYC_COLORS[user.kycStatus || ''] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.kycStatus || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-mono">
                      PKR {Number(user.walletBalance || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-dao-blue bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <FiEye className="text-sm" /> View
                      </Link>
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
              {pagination.total} users
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

      {/* Create Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {createdStaff ? 'Staff Account Created' : 'Create Staff Account'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {createdStaff ? (
              <div className="p-6 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 mb-3">
                    Staff account created successfully. Share these credentials securely:
                  </p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-green-600 font-medium">Email</span>
                      <p className="text-sm font-mono text-green-900">{createdStaff.email}</p>
                    </div>
                    <div>
                      <span className="text-xs text-green-600 font-medium">Employee ID</span>
                      <p className="text-sm font-mono text-green-900">{createdStaff.employeeId}</p>
                    </div>
                    <div>
                      <span className="text-xs text-green-600 font-medium">Temporary Password</span>
                      <p className="text-sm font-mono text-green-900 bg-green-100 px-2 py-1 rounded">
                        {createdStaff.temporaryPassword}
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={closeModal} className="btn-blue w-full !py-2.5 text-sm">
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit((data) => createStaffMutation.mutate(data))}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                    placeholder="staff@syntiant.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      {...register('firstName')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      {...register('lastName')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    {...register('roleId')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue bg-white"
                  >
                    <option value="">Select a role</option>
                    <option value="staff">Staff</option>
                    <option value="operations_manager">Operations Manager</option>
                  </select>
                  {errors.roleId && (
                    <p className="text-xs text-red-500 mt-1">{errors.roleId.message}</p>
                  )}
                </div>

                {createStaffMutation.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    Failed to create staff account. Please try again.
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1 !py-2.5 text-sm">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createStaffMutation.isPending}
                    className="btn-blue flex-1 !py-2.5 text-sm disabled:opacity-60"
                  >
                    {createStaffMutation.isPending ? 'Creating...' : 'Create Staff'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
