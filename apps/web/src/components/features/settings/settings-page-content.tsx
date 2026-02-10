'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import {
  FiUser,
  FiLock,
  FiSave,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

/* --- Schemas --- */
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

/* --- Feedback Message --- */
function FeedbackMessage({
  type,
  message,
}: {
  type: 'success' | 'error';
  message: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
        type === 'success'
          ? 'bg-green-50 border border-green-200 text-green-700'
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}
    >
      {type === 'success' ? (
        <FiCheckCircle className="text-base flex-shrink-0" />
      ) : (
        <FiAlertCircle className="text-base flex-shrink-0" />
      )}
      {message}
    </div>
  );
}

/* --- Input Field Component --- */
function InputField({
  label,
  type = 'text',
  disabled = false,
  error,
  ...props
}: {
  label: string;
  type?: string;
  disabled?: boolean;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        disabled={disabled}
        className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200' : 'border-gray-300 focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue'}
          ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/* --- Profile Form Skeleton --- */
function ProfileSkeleton() {
  return (
    <div className="card animate-pulse space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-gray-100" />
        <div>
          <div className="h-5 w-40 bg-gray-100 rounded mb-1" />
          <div className="h-3 w-56 bg-gray-50 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 w-20 bg-gray-100 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="h-10 w-32 bg-gray-100 rounded-lg" />
    </div>
  );
}

/* --- Profile Information Section --- */
function ProfileSection() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  // Pre-fill form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; phone?: string }) =>
      api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message:
          err?.response?.data?.message ??
          err?.message ??
          'Failed to update profile. Please try again.',
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    setFeedback(null);
    mutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? undefined,
    });
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-dao-blue/10 flex items-center justify-center text-dao-blue">
          <FiUser className="text-xl" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Profile Information
          </h2>
          <p className="text-sm text-gray-500">
            Update your personal details and contact information.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="mb-4">
          <FeedbackMessage type={feedback.type} message={feedback.message} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            placeholder="Enter first name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <InputField
            label="Last Name"
            placeholder="Enter last name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
          <InputField
            label="Email Address"
            type="email"
            disabled
            error={errors.email?.message}
            {...register('email')}
          />
          <InputField
            label="Phone Number"
            type="tel"
            placeholder="e.g. +92 300 1234567"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !isDirty}
          className="btn-blue flex items-center gap-2 !px-5 !py-2.5 text-sm
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FiSave />
          )}
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

/* --- Change Password Section --- */
function PasswordSection() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.changePassword(data),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Password updated successfully.' });
      reset();
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message:
          err?.response?.data?.message ??
          err?.message ??
          'Failed to change password. Please check your current password.',
      });
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    setFeedback(null);
    mutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-dao-blue/10 flex items-center justify-center text-dao-blue">
          <FiLock className="text-xl" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Change Password
          </h2>
          <p className="text-sm text-gray-500">
            Update your password to keep your account secure.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="mb-4">
          <FeedbackMessage type={feedback.type} message={feedback.message} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          label="Current Password"
          type="password"
          placeholder="Enter your current password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="New Password"
            type="password"
            placeholder="Minimum 8 characters"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <InputField
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            error={errors.confirmNewPassword?.message}
            {...register('confirmNewPassword')}
          />
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
            <FiLock />
          )}
          {mutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

/* --- Main Settings Content --- */
export function SettingsPageContent() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your profile and security preferences.
        </p>
      </div>

      <ProfileSection />
      <PasswordSection />
    </div>
  );
}
