'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { FiCheck } from 'react-icons/fi';
import { api } from '@/lib/api-client';

const propertySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  propertyType: z.enum(['Residential', 'Commercial', 'Land', 'Mixed Use'], {
    required_error: 'Property type is required',
  }),
  location: z.string().min(1, 'Location is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  totalValue: z.coerce.number().positive('Total value must be positive'),
  fundingTarget: z.coerce.number().positive('Funding target must be positive'),
  minInvestment: z.coerce.number().positive('Minimum investment must be positive'),
  maxInvestment: z.coerce.number().positive('Maximum investment must be positive'),
  expectedReturnsAnnual: z.coerce
    .number()
    .min(0, 'Expected returns must be 0 or more')
    .max(100, 'Expected returns cannot exceed 100%'),
  rentalYield: z.coerce
    .number()
    .min(0, 'Rental yield must be 0 or more')
    .max(100, 'Rental yield cannot exceed 100%'),
  areaSqft: z.coerce.number().positive('Area must be positive'),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function NewPropertyPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: PropertyFormData) =>
      api.createProperty({
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        location: data.location,
        address: data.address,
        city: data.city,
        totalValue: String(data.totalValue),
        fundingTarget: String(data.fundingTarget),
        minInvestment: String(data.minInvestment),
        maxInvestment: String(data.maxInvestment),
        expectedReturnsAnnual: String(data.expectedReturnsAnnual),
        rentalYield: String(data.rentalYield),
        areaSqft: String(data.areaSqft),
      }),
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/seller');
      }, 2000);
    },
  });

  const onSubmit = (data: PropertyFormData) => {
    createMutation.mutate(data);
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClass = 'text-xs text-red-500 mt-1';

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheck className="text-3xl text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Submitted!</h2>
        <p className="text-gray-500">
          Your property has been submitted for review. You will be notified once it is approved.
        </p>
        <p className="text-sm text-gray-400 mt-4">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">List New Property</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the property details below. It will be submitted for admin review.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Basic Information
          </h2>

          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              {...register('title')}
              className={inputClass}
              placeholder="e.g. Luxury Apartment in Bahria Town"
            />
            {errors.title && <p className={errorClass}>{errors.title.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Describe the property, its features, and investment potential..."
            />
            {errors.description && <p className={errorClass}>{errors.description.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Property Type</label>
            <select {...register('propertyType')} className={`${inputClass} bg-white`}>
              <option value="">Select type</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Land">Land</option>
              <option value="Mixed Use">Mixed Use</option>
            </select>
            {errors.propertyType && <p className={errorClass}>{errors.propertyType.message}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Location
          </h2>

          <div>
            <label className={labelClass}>Location / Area</label>
            <input
              type="text"
              {...register('location')}
              className={inputClass}
              placeholder="e.g. Bahria Town Phase 8"
            />
            {errors.location && <p className={errorClass}>{errors.location.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Street Address</label>
            <input
              type="text"
              {...register('address')}
              className={inputClass}
              placeholder="e.g. Block A, Street 5, House 12"
            />
            {errors.address && <p className={errorClass}>{errors.address.message}</p>}
          </div>

          <div>
            <label className={labelClass}>City</label>
            <input
              type="text"
              {...register('city')}
              className={inputClass}
              placeholder="e.g. Islamabad"
            />
            {errors.city && <p className={errorClass}>{errors.city.message}</p>}
          </div>
        </div>

        {/* Financial */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Financial Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Total Value (PKR)</label>
              <input
                type="number"
                {...register('totalValue')}
                className={inputClass}
                placeholder="e.g. 50000000"
              />
              {errors.totalValue && <p className={errorClass}>{errors.totalValue.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Funding Target (PKR)</label>
              <input
                type="number"
                {...register('fundingTarget')}
                className={inputClass}
                placeholder="e.g. 25000000"
              />
              {errors.fundingTarget && <p className={errorClass}>{errors.fundingTarget.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Min Investment (PKR)</label>
              <input
                type="number"
                {...register('minInvestment')}
                className={inputClass}
                placeholder="e.g. 50000"
              />
              {errors.minInvestment && <p className={errorClass}>{errors.minInvestment.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Max Investment (PKR)</label>
              <input
                type="number"
                {...register('maxInvestment')}
                className={inputClass}
                placeholder="e.g. 5000000"
              />
              {errors.maxInvestment && <p className={errorClass}>{errors.maxInvestment.message}</p>}
            </div>
          </div>
        </div>

        {/* Returns */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Expected Returns
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Expected Annual Returns (%)</label>
              <input
                type="number"
                step="0.1"
                {...register('expectedReturnsAnnual')}
                className={inputClass}
                placeholder="e.g. 12.5"
              />
              {errors.expectedReturnsAnnual && (
                <p className={errorClass}>{errors.expectedReturnsAnnual.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Rental Yield (%)</label>
              <input
                type="number"
                step="0.1"
                {...register('rentalYield')}
                className={inputClass}
                placeholder="e.g. 7.0"
              />
              {errors.rentalYield && <p className={errorClass}>{errors.rentalYield.message}</p>}
            </div>
          </div>
        </div>

        {/* Area */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Property Size
          </h2>

          <div>
            <label className={labelClass}>Area (sq ft)</label>
            <input
              type="number"
              {...register('areaSqft')}
              className={inputClass}
              placeholder="e.g. 2500"
            />
            {errors.areaSqft && <p className={errorClass}>{errors.areaSqft.message}</p>}
          </div>
        </div>

        {/* Error message */}
        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Failed to submit property. Please check your inputs and try again.
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary !py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-blue !py-2.5 text-sm disabled:opacity-60"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
