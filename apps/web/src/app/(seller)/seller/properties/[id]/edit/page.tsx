'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
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
  expectedReturnsAnnual: z.coerce.number().min(0).max(100),
  rentalYield: z.coerce.number().min(0).max(100),
  areaSqft: z.coerce.number().positive('Area must be positive'),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const propertyId = Number(params.id);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => api.getProperty(propertyId),
    enabled: !!propertyId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  });

  useEffect(() => {
    if (property) {
      reset({
        title: property.title || '',
        description: property.description || '',
        propertyType: (property.propertyType as any) || 'Residential',
        location: property.location || '',
        address: property.address || '',
        city: property.city || '',
        totalValue: Number(property.totalValue) || 0,
        fundingTarget: Number(property.fundingTarget) || 0,
        minInvestment: Number(property.minInvestment) || 0,
        maxInvestment: Number(property.maxInvestment) || 0,
        expectedReturnsAnnual: Number(property.expectedReturnsAnnual) || 0,
        rentalYield: Number(property.rentalYield) || 0,
        areaSqft: Number(property.areaSqft) || 0,
      });
    }
  }, [property, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: PropertyFormData) =>
      api.updateProperty(propertyId, {
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
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'properties'] });
      router.push(`/seller/properties/${propertyId}`);
    },
  });

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClass = 'text-xs text-red-500 mt-1';

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="card animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-2/3" />
          <div className="h-10 bg-gray-100 rounded w-full" />
          <div className="h-10 bg-gray-100 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="card text-center py-16">
        <h3 className="font-medium text-gray-900 mb-1">Property not found</h3>
        <button onClick={() => router.back()} className="btn-blue mt-4 !py-2.5 !px-4 text-sm">
          Go Back
        </button>
      </div>
    );
  }

  if (!['pending', 'rejected'].includes(property.status || '')) {
    return (
      <div className="card text-center py-16">
        <h3 className="font-medium text-gray-900 mb-1">Cannot edit this property</h3>
        <p className="text-sm text-gray-500 mb-6">
          Only properties with &quot;pending&quot; or &quot;rejected&quot; status can be edited.
        </p>
        <button
          onClick={() => router.push(`/seller/properties/${propertyId}`)}
          className="btn-blue !py-2.5 !px-4 text-sm"
        >
          View Property
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <FiArrowLeft />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update the property details. Changes will be re-submitted for review.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Basic Information
          </h2>
          <div>
            <label className={labelClass}>Title</label>
            <input type="text" {...register('title')} className={inputClass} />
            {errors.title && <p className={errorClass}>{errors.title.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea {...register('description')} rows={4} className={`${inputClass} resize-none`} />
            {errors.description && <p className={errorClass}>{errors.description.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Property Type</label>
            <select {...register('propertyType')} className={`${inputClass} bg-white`}>
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
            <input type="text" {...register('location')} className={inputClass} />
            {errors.location && <p className={errorClass}>{errors.location.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Street Address</label>
            <input type="text" {...register('address')} className={inputClass} />
            {errors.address && <p className={errorClass}>{errors.address.message}</p>}
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input type="text" {...register('city')} className={inputClass} />
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
              <input type="number" {...register('totalValue')} className={inputClass} />
              {errors.totalValue && <p className={errorClass}>{errors.totalValue.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Funding Target (PKR)</label>
              <input type="number" {...register('fundingTarget')} className={inputClass} />
              {errors.fundingTarget && <p className={errorClass}>{errors.fundingTarget.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Min Investment (PKR)</label>
              <input type="number" {...register('minInvestment')} className={inputClass} />
              {errors.minInvestment && <p className={errorClass}>{errors.minInvestment.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Max Investment (PKR)</label>
              <input type="number" {...register('maxInvestment')} className={inputClass} />
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
              <input type="number" step="0.1" {...register('expectedReturnsAnnual')} className={inputClass} />
              {errors.expectedReturnsAnnual && <p className={errorClass}>{errors.expectedReturnsAnnual.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Rental Yield (%)</label>
              <input type="number" step="0.1" {...register('rentalYield')} className={inputClass} />
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
            <input type="number" {...register('areaSqft')} className={inputClass} />
            {errors.areaSqft && <p className={errorClass}>{errors.areaSqft.message}</p>}
          </div>
        </div>

        {/* Error */}
        {updateMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Failed to update property. Please check your inputs and try again.
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
            disabled={updateMutation.isPending}
            className="btn-blue flex items-center gap-2 !py-2.5 text-sm disabled:opacity-60"
          >
            {updateMutation.isPending ? (
              'Saving...'
            ) : (
              <>
                <FiCheck /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
