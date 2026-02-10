import { TransactionType, TransactionStatus } from './enums';

export interface Transaction {
  id: number;
  userId: number;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  referenceId?: string;
  description?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
    totalInvestments: number;
    totalDividends: number;
  };
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}
