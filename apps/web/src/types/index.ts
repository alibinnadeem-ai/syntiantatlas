export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleId: string | null;
  kycStatus: string | null;
  kycLevel: number | null;
  walletBalance: string;
  phone: string | null;
  status: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    investments: number;
    transactions: number;
    properties: number;
  };
}

export interface Property {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  propertyType: string | null;
  areaSqft: string | null;
  totalValue: string | null;
  fundingTarget: string | null;
  fundingRaised: string | null;
  minInvestment: string | null;
  maxInvestment: string | null;
  expectedReturnsAnnual: string | null;
  rentalYield: string | null;
  status: string | null;
  sellerId: number | null;
  createdAt: string;
  seller?: { id: number; firstName: string; lastName: string; email: string };
  _count?: { investments: number };
  investorCount?: number;
}

export interface Investment {
  id: number;
  investorId: number | null;
  propertyId: number | null;
  amountInvested: string;
  sharesOwned: string | null;
  ownershipPercentage: string | null;
  investmentDate: string;
  property?: Property;
}

export interface Transaction {
  id: number;
  userId: number | null;
  type: string;
  amount: string;
  gateway: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  description: string | null;
  status: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface TransactionSummary {
  totalDeposits: string;
  totalWithdrawals: string;
  totalInvestments: string;
  totalDividends: string;
}

export interface PortfolioSummary {
  investments: (Investment & { property: Property })[];
  summary: {
    totalInvested: string;
    totalShares: string;
    propertyCount: number;
  };
}

export interface KycVerification {
  id: number;
  userId: number | null;
  kycLevel: number | null;
  documentType: string | null;
  documentData: Record<string, any> | null;
  status: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user?: { id: number; email: string; firstName: string | null; lastName: string | null; kycStatus: string | null; kycLevel: number | null };
  reviewer?: { id: number; firstName: string | null; lastName: string | null };
}

export interface KycStatus {
  kycStatus: string | null;
  kycLevel: number | null;
  submissions: KycVerification[];
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  category: string | null;
  updatedAt: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  assignedTo: number | null;
  assignedBy: number | null;
  priority: string | null;
  status: string | null;
  dueDate: string | null;
  completedAt: string | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  createdAt: string;
  updatedAt: string;
  assignedByUser?: { id: number; firstName: string | null; lastName: string | null; email: string };
  assignedToUser?: { id: number; firstName: string | null; lastName: string | null; email: string };
  replies?: TicketReply[];
  _count?: { replies: number };
}

export interface TicketReply {
  id: number;
  taskId: number;
  userId: number;
  message: string;
  createdAt: string;
  user?: { id: number; firstName: string | null; lastName: string | null; email: string };
}

export interface GovernanceProposal {
  id: number;
  propertyId: number;
  title: string;
  description: string;
  proposer: { id: number; firstName: string | null; lastName: string | null; email: string };
  property: { id: number; title: string };
  forVotes: number;
  againstVotes: number;
  quorum: number;
  status: string; // 'active', 'passed', 'failed', 'executed', 'cancelled'
  votingEndsAt: string;
  createdAt: string;
  hasVoted?: boolean;
  userVote?: string;
  userVoteWeight?: number;
}

export interface GovernanceVote {
  proposalId: number;
  proposal: GovernanceProposal;
  vote: string; // 'for' | 'against'
  weight: number;
  votedAt: string;
}
