import { PropertyStatus, PropertyType } from './enums';

export interface Property {
  id: number;
  title: string;
  description?: string;
  address: string;
  city: string;
  propertyType: PropertyType;
  totalValue: number;
  minInvestment: number;
  maxInvestment: number;
  expectedReturn: number;
  fundingTarget: number;
  fundingRaised: number;
  totalShares: number;
  pricePerShare: number;
  status: PropertyStatus;
  sellerId: number;
  images?: string[];
  amenities?: string[];
  documents?: string[];
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyListParams {
  page?: number;
  limit?: number;
  city?: string;
  propertyType?: PropertyType;
  status?: PropertyStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
