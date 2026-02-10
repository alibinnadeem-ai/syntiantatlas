import { UserRole, KycStatus, UserStatus } from './enums';

export interface User {
  id: number;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  roleId: UserRole;
  staffId?: string;
  googleId?: string;
  avatarUrl?: string;
  kycStatus: KycStatus;
  kycLevel: number;
  walletBalance: number;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId: UserRole;
  kycStatus: KycStatus;
  kycLevel: number;
  walletBalance: number;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: 'investor' | 'seller';
}
