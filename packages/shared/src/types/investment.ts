export interface Investment {
  id: number;
  userId: number;
  propertyId: number;
  amountInvested: number;
  sharesOwned: number;
  ownershipPercentage: number;
  investedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioItem {
  investment: Investment;
  property: {
    id: number;
    title: string;
    city: string;
    totalValue: number;
    expectedReturn: number;
    fundingRaised: number;
    fundingTarget: number;
    status: string;
  };
}

export interface InvestRequest {
  propertyId: number;
  amount: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalProperties: number;
  estimatedReturns: number;
  investments: PortfolioItem[];
}
