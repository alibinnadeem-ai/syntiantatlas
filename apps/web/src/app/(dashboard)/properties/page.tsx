'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiMapPin, FiMaximize, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { api } from '@/lib/api-client';
import type { Property } from '@/types';

const PROPERTY_TYPES = ['All', 'Residential', 'Commercial', 'Land', 'Mixed'] as const;
const STATUS_OPTIONS = ['All', 'Active', 'Funded'] as const;

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

function PropertyCardSkeleton() {
  return (
    <div className="card !p-0 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-2 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const queryParams: Record<string, string | number> = { page, limit: 9 };
  if (search.trim()) queryParams.search = search.trim();
  if (typeFilter !== 'All') queryParams.propertyType = typeFilter;
  if (statusFilter !== 'All') queryParams.status = statusFilter.toLowerCase();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['properties', queryParams],
    queryFn: () => api.getProperties(queryParams),
  });

  const properties = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Investment Properties</h1>
        <p className="mt-2 text-gray-600">
          Browse and invest in verified real estate opportunities across Pakistan.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search properties by name, location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44 px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                     bg-white focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
        >
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All Types' : t}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-40 px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                     bg-white focus:outline-none focus:ring-2 focus:ring-dao-blue/30 focus:border-dao-blue"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All Status' : s}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-20">
          <p className="text-red-500 text-lg font-medium">Failed to load properties.</p>
          <p className="text-gray-500 mt-1 text-sm">Please try again later.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && properties.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiSearch className="text-gray-400 text-2xl" />
          </div>
          <p className="text-gray-700 text-lg font-medium">No properties found</p>
          <p className="text-gray-500 mt-1 text-sm">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </div>
      )}

      {/* Properties Grid */}
      {!isLoading && !isError && properties.length > 0 && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: Property) => {
              const pct = fundingPercent(property.fundingRaised, property.fundingTarget);
              return (
                <div key={property.id} className="card !p-0 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="relative h-48 bg-gradient-to-r from-dao-blue to-dao-blue-dark flex items-end">
                    <div className="absolute inset-0 bg-black/20" />
                    {property.propertyType && (
                      <span className="absolute top-3 right-3 bg-white/90 text-dao-blue text-xs font-semibold px-2.5 py-1 rounded-full z-10">
                        {property.propertyType}
                      </span>
                    )}
                    <h3 className="relative z-10 text-white font-semibold text-lg px-5 pb-4 leading-snug">
                      {property.title}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Location & Area */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiMapPin className="text-dao-blue" />
                        {property.city || 'N/A'}
                      </span>
                      {property.areaSqft && (
                        <span className="flex items-center gap-1">
                          <FiMaximize className="text-dao-blue" />
                          {parseFloat(property.areaSqft).toLocaleString()} sqft
                        </span>
                      )}
                    </div>

                    {/* Funding Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Funding Progress</span>
                        <span className="font-medium text-dao-blue">{pct}%</span>
                      </div>
                      <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-dao-blue h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatPKR(property.fundingRaised)} / {formatPKR(property.fundingTarget)}
                      </p>
                    </div>

                    {/* Min Investment & Returns */}
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Min Investment</p>
                        <p className="font-semibold text-gray-800">{formatPKR(property.minInvestment)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">Expected Returns</p>
                        <p className="font-semibold text-green-600">
                          {property.expectedReturnsAnnual
                            ? `${parseFloat(property.expectedReturnsAnnual).toFixed(1)}%`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* View Details Link */}
                    <Link
                      href={`/properties/${property.id}`}
                      className="btn-blue block text-center w-full !py-2.5 text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium
                           text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <FiChevronLeft className="text-base" />
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium
                           text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
                <FiChevronRight className="text-base" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
