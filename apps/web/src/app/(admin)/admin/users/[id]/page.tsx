'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiArrowLeft, FiEdit2, FiShield, FiShieldOff, FiTrash2, FiUser, FiMail, FiPhone, FiBriefcase, FiDollarSign, FiTrendingUp, FiFileText, FiHome } from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  roleId: z.enum(['investor', 'seller', 'admin', 'staff', 'operations_manager'], {
    required_error: 'Role is required',
  }),
});

type EditUserForm = z.infer<typeof editUserSchema>;

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  investor: 'bg-blue-100 text-blue-700',
  seller: 'bg-green-100 text-green-700',
  staff: 'bg-purple-100 text-purple-700',
  operations_manager: 'bg-purple-100 text-purple-700',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  deactivated: 'bg-red-100 text-red-700',
};

const KYC_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = Number(params.id);

  const [editing, setEditing] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => api.getUser(userId),
    enabled: !!userId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditUserForm) => api.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditing(false);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => api.suspendUser(userId, { reason: suspendReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowSuspendModal(false);
      setSuspendReason('');
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: () => api.unsuspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => api.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      router.push('/admin/users');
    },
  });

  const startEditing = () => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        roleId: (user.roleId as EditUserForm['roleId']) || 'investor',
      });
      setEditing(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-dao-blue border-t-transparent rounded-full animate-spin" />
          Loading user details...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">User not found.</p>
        <button onClick={() => router.push('/admin/users')} className="text-dao-blue hover:underline mt-2 text-sm">
          Back to users
        </button>
      </div>
    );
  }

  const isAdmin = user.roleId === 'admin';
  const isSuspended = user.status === 'suspended';
  const isDeactivated = user.status === 'deactivated';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/users')}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <FiArrowLeft />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unnamed User'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && !isDeactivated && (
            <button onClick={startEditing} className="btn-secondary flex items-center gap-2 !py-2 !px-4 text-sm">
              <FiEdit2 className="text-sm" /> Edit
            </button>
          )}
          {!isAdmin && !isDeactivated && (
            <>
              {isSuspended ? (
                <button
                  onClick={() => unsuspendMutation.mutate()}
                  disabled={unsuspendMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  <FiShield className="text-sm" /> {unsuspendMutation.isPending ? 'Unsuspending...' : 'Unsuspend'}
                </button>
              ) : (
                <button
                  onClick={() => setShowSuspendModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <FiShieldOff className="text-sm" /> Suspend
                </button>
              )}
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <FiTrash2 className="text-sm" /> Deactivate
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-3">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[user.roleId || ''] || 'bg-gray-100 text-gray-600'}`}>
          {user.roleId?.replace('_', ' ') || 'Unknown Role'}
        </span>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[user.status || 'active'] || 'bg-gray-100 text-gray-600'}`}>
          {user.status || 'active'}
        </span>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${KYC_COLORS[user.kycStatus || ''] || 'bg-gray-100 text-gray-600'}`}>
          KYC: {user.kycStatus || 'None'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info / Edit Form */}
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editing ? 'Edit User Details' : 'User Details'}
          </h2>

          {editing ? (
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                  />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  {...register('roleId')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue bg-white"
                >
                  <option value="investor">Investor</option>
                  <option value="seller">Seller</option>
                  <option value="staff">Staff</option>
                  <option value="operations_manager">Operations Manager</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.roleId && <p className="text-xs text-red-500 mt-1">{errors.roleId.message}</p>}
              </div>

              {updateMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  Failed to update user. Please try again.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary !py-2.5 !px-6 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending || !isDirty}
                  className="btn-blue !py-2.5 !px-6 text-sm disabled:opacity-60"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiUser className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '--'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiMail className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiPhone className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{user.phone || '--'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiBriefcase className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{user.roleId?.replace('_', ' ') || '--'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiDollarSign className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Wallet Balance</p>
                    <p className="text-sm font-medium text-gray-900">
                      PKR {Number(user.walletBalance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiShield className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">KYC Level</p>
                    <p className="text-sm font-medium text-gray-900">Level {user.kycLevel || 0}</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Joined {format(new Date(user.createdAt), 'MMMM d, yyyy')} &middot; User ID: {user.id}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Activity Summary */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiTrendingUp className="text-blue-500" />
                  <span className="text-sm text-blue-700">Investments</span>
                </div>
                <span className="text-lg font-bold text-blue-700">{user._count?.investments ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiFileText className="text-green-500" />
                  <span className="text-sm text-green-700">Transactions</span>
                </div>
                <span className="text-lg font-bold text-green-700">{user._count?.transactions ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiHome className="text-purple-500" />
                  <span className="text-sm text-purple-700">Properties</span>
                </div>
                <span className="text-lg font-bold text-purple-700">{user._count?.properties ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Suspend User</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to suspend <strong>{user.firstName} {user.lastName}</strong>? They will not be able to access the platform while suspended.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                  rows={3}
                  placeholder="Enter reason for suspension..."
                />
              </div>

              {suspendMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  Failed to suspend user. Please try again.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowSuspendModal(false); setSuspendReason(''); }}
                  className="btn-secondary flex-1 !py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => suspendMutation.mutate()}
                  disabled={suspendMutation.isPending}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-60"
                >
                  {suspendMutation.isPending ? 'Suspending...' : 'Suspend User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-red-700">Deactivate User</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  This action will permanently deactivate <strong>{user.firstName} {user.lastName}</strong>&apos;s account. This cannot be easily undone.
                </p>
              </div>

              {deactivateMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  Failed to deactivate user. Please try again.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeactivateModal(false)}
                  className="btn-secondary flex-1 !py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deactivateMutation.mutate()}
                  disabled={deactivateMutation.isPending}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
