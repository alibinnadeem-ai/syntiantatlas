'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FiArrowLeft,
  FiMapPin,
  FiMaximize,
  FiUser,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiHome,
  FiX,
  FiCheckCircle,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';

function formatPKR(value: string | null): string {
  if (!value) return 'PKR 0';
  const num = parseFloat(value);
  if (num >= 10_000_000) return `PKR ${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `PKR ${(num / 100_000).toFixed(2)} Lac`;
  return `PKR ${num.toLocaleString()}`;
}

function fundingPercent(raised: string | null, target: string | null): number {
  const r = parseFloat(raised || '0');
  const t = parseFloat(target || '1');
  if (t === 0) return 0;
  return Math.min(Math.round((r / t) * 100), 100);
}

function statusBadge(status: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'active')
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        Active
      </span>
    );
  if (s === 'funded')
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-dao-blue/10 text-dao-blue">
        Funded
      </span>
    );
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
      {status || 'Pending'}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-24 mb-6" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-80 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [investSuccess, setInvestSuccess] = useState(false);

  const propertyId = parseInt(id, 10);

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => api.getProperty(propertyId),
    enabled: !isNaN(propertyId),
  });

  const minInvest = parseFloat(property?.minInvestment || '0');
  const maxInvest = parseFloat(property?.maxInvestment || '100000000');

  const investSchema = z.object({
    amount: z
      .number({ invalid_type_error: 'Please enter a valid amount' })
      .min(minInvest || 1, `Minimum investment is ${formatPKR(property?.minInvestment || '0')}`)
      .max(maxInvest, `Maximum investment is ${formatPKR(property?.maxInvestment || '0')}`),
  });

  type InvestForm = z.infer<typeof investSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvestForm>({
    resolver: zodResolver(investSchema),
  });

  const investMutation = useMutation({
    mutationFn: (data: { propertyId: number; amount: number }) => api.invest(data),
    onSuccess: () => {
      setInvestSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  const onInvest = (data: InvestForm) => {
    investMutation.mutate({ propertyId, amount: data.amount });
  };

  const closeModal = () => {
    setShowModal(false);
    setInvestSuccess(false);
    investMutation.reset();
    reset();
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-red-500 text-lg font-medium">Property not found.</p>
        <Link href="/properties" className="text-dao-blue hover:underline text-sm mt-2 inline-block">
          Back to Properties
        </Link>
      </div>
    );
  }

  const pct = fundingPercent(property.fundingRaised, property.fundingTarget);
  const investorCount = property.investorCount ?? property._count?.investments ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/properties')}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-dao-blue transition mb-6"
      >
        <FiArrowLeft />
        Back to Properties
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Image */}
          <div className="relative h-64 sm:h-80 bg-gradient-to-r from-dao-blue to-dao-blue-dark rounded-xl flex items-end overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 p-6 sm:p-8">
              <div className="mb-2">{statusBadge(property.status)}</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                {property.title}
              </h1>
              {property.city && (
                <p className="text-blue-100 mt-1 flex items-center gap-1 text-sm">
                  <FiMapPin /> {property.city}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          {/* Property Details Grid */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FiMapPin className="text-dao-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-sm font-medium text-gray-800">{property.location || property.address || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FiHome className="text-dao-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">City</p>
                  <p className="text-sm font-medium text-gray-800">{property.city || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FiHome className="text-dao-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Property Type</p>
                  <p className="text-sm font-medium text-gray-800">{property.propertyType || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FiMaximize className="text-dao-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Area</p>
                  <p className="text-sm font-medium text-gray-800">
                    {property.areaSqft ? `${parseFloat(property.areaSqft).toLocaleString()} sqft` : 'N/A'}
                  </p>
                </div>
              </div>
              {property.seller && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg sm:col-span-2">
                  <FiUser className="text-dao-blue mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Seller</p>
                    <p className="text-sm font-medium text-gray-800">
                      {property.seller.firstName} {property.seller.lastName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:sticky lg:top-6 self-start space-y-6">
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Investment Overview</h2>

            {/* Key figures */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Value</span>
                <span className="font-semibold text-gray-800">{formatPKR(property.totalValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Funding Target</span>
                <span className="font-semibold text-gray-800">{formatPKR(property.fundingTarget)}</span>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Funding Raised</span>
                  <span className="font-semibold text-dao-blue">{pct}%</span>
                </div>
                <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-dao-blue h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatPKR(property.fundingRaised)} raised
                </p>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Investment details */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Min Investment</span>
                <span className="font-medium text-gray-800">{formatPKR(property.minInvestment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Max Investment</span>
                <span className="font-medium text-gray-800">{formatPKR(property.maxInvestment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expected Annual Returns</span>
                <span className="font-semibold text-green-600">
                  {property.expectedReturnsAnnual
                    ? `${parseFloat(property.expectedReturnsAnnual).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rental Yield</span>
                <span className="font-semibold text-green-600">
                  {property.rentalYield
                    ? `${parseFloat(property.rentalYield).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Investors</span>
                <span className="font-medium text-gray-800 flex items-center gap-1">
                  <FiUsers className="text-dao-blue" />
                  {investorCount}
                </span>
              </div>
            </div>

            {/* Invest Button */}
            <button
              onClick={() => setShowModal(true)}
              className="btn-blue w-full flex items-center justify-center gap-2"
            >
              <FiDollarSign />
              Invest Now
            </button>
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="text-xl" />
            </button>

            {investSuccess ? (
              <div className="text-center py-4">
                <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Investment Successful!</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Your investment in <strong>{property.title}</strong> has been processed successfully.
                </p>
                <button onClick={closeModal} className="btn-blue w-full">
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Invest in Property</h3>
                <p className="text-gray-500 text-sm mb-6">{property.title}</p>

                <form onSubmit={handleSubmit(onInvest)} className="space-y-5">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Investment Amount (PKR)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step="any"
                      placeholder={`Min: ${formatPKR(property.minInvestment)}`}
                      {...register('amount', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                    )}
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Min: {formatPKR(property.minInvestment)}</span>
                      <span>Max: {formatPKR(property.maxInvestment)}</span>
                    </div>
                  </div>

                  {investMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                      {(investMutation.error as any)?.response?.data?.message ||
                        'Investment failed. Please try again.'}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={investMutation.isPending}
                    className="btn-blue w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {investMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Confirm Investment'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
