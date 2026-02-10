import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MarketAnalyticsDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  /** Assumed total shares per property (platform standard). */
  private static readonly TOTAL_SHARES = 1000;

  constructor(private prisma: PrismaService) {}

  // ===========================================================================
  // Property Valuation
  // ===========================================================================

  async getPropertyValuation(propertyId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // ---- Latest trades for implied valuation ----
    const trades = await this.prisma.marketplaceTrade.findMany({
      where: { propertyId, status: 'completed' },
      orderBy: { executedAt: 'desc' },
    });

    const totalValue = property.totalValue || new Decimal(0);
    const tradingVolume = trades.length;

    // Current implied valuation: average of latest trade prices * total shares
    let currentValuation = totalValue;
    if (trades.length > 0) {
      const latestPrices = trades.slice(0, Math.min(10, trades.length));
      const avgPrice = latestPrices
        .reduce((sum, t) => sum.plus(t.pricePerShare), new Decimal(0))
        .dividedBy(latestPrices.length);
      currentValuation = avgPrice.times(AnalyticsService.TOTAL_SHARES);
    }

    // ---- Price trend: latest 5 vs oldest 5 ----
    let priceChangePercent = 0;
    if (trades.length >= 2) {
      const latestBatch = trades.slice(0, Math.min(5, trades.length));
      const oldestBatch = trades.slice(-Math.min(5, trades.length));

      const avgLatest = latestBatch
        .reduce((s, t) => s.plus(t.pricePerShare), new Decimal(0))
        .dividedBy(latestBatch.length);

      const avgOldest = oldestBatch
        .reduce((s, t) => s.plus(t.pricePerShare), new Decimal(0))
        .dividedBy(oldestBatch.length);

      if (!avgOldest.isZero()) {
        priceChangePercent = avgLatest
          .minus(avgOldest)
          .dividedBy(avgOldest)
          .times(100)
          .toNumber();
      }
    }

    // ---- Dividend yield ----
    const currentYear = new Date().getFullYear();
    const dividends = await this.prisma.dividend.findMany({
      where: { propertyId, year: currentYear },
    });

    const annualDividends = dividends.reduce(
      (sum, d) => sum.plus(d.netIncome || new Decimal(0)),
      new Decimal(0),
    );

    const dividendYield = totalValue.greaterThan(0)
      ? annualDividends.dividedBy(totalValue).times(100).toNumber()
      : 0;

    // ---- Funding progress ----
    const fundingTarget = property.fundingTarget || new Decimal(0);
    const fundingRaised = property.fundingRaised || new Decimal(0);
    const fundingProgress = fundingTarget.greaterThan(0)
      ? fundingRaised.dividedBy(fundingTarget).times(100).toNumber()
      : 0;

    // ---- Annualized return (rental yield from property data) ----
    const annualizedReturn = property.expectedReturnsAnnual
      ? Number(property.expectedReturnsAnnual)
      : dividendYield;

    // ---- Risk score (1-10) ----
    const riskScore = this.computePropertyRiskScore({
      fundingProgress,
      hasDividends: dividends.length > 0,
      tradingVolume,
      rentalYield: property.rentalYield
        ? Number(property.rentalYield)
        : 0,
    });

    const riskLabel = this.riskLabel(riskScore);

    // ---- Recommendation ----
    const recommendation = this.generateRecommendation(
      riskScore,
      priceChangePercent,
      dividendYield,
      fundingProgress,
    );

    return {
      propertyId,
      title: property.title,
      currentValuation: currentValuation.toNumber(),
      originalValue: totalValue.toNumber(),
      priceChangePercent: Math.round(priceChangePercent * 100) / 100,
      dividendYield: Math.round(dividendYield * 100) / 100,
      annualizedReturn: Math.round(annualizedReturn * 100) / 100,
      riskScore,
      riskLabel,
      fundingProgress: Math.round(fundingProgress * 100) / 100,
      tradingVolume,
      recommendation,
    };
  }

  // ===========================================================================
  // Portfolio Analysis
  // ===========================================================================

  async getPortfolioAnalysis(investorId: number) {
    const investments = await this.prisma.investment.findMany({
      where: { investorId },
      include: {
        property: true,
      },
    });

    if (investments.length === 0) {
      return {
        investorId,
        totalInvested: 0,
        currentPortfolioValue: 0,
        unrealizedGainLoss: 0,
        unrealizedGainLossPercent: 0,
        diversificationScore: 0,
        totalDividendsReceived: 0,
        annualizedReturn: 0,
        riskAdjustedReturn: 0,
        assetAllocation: [],
        topPerformers: [],
        worstPerformers: [],
        holdings: [],
      };
    }

    // ---- Aggregate portfolio values ----
    let totalInvested = new Decimal(0);
    let currentPortfolioValue = new Decimal(0);
    const holdingDetails: Array<{
      propertyId: number;
      title: string;
      propertyType: string;
      invested: Decimal;
      currentValue: Decimal;
      sharesOwned: Decimal;
      gainLossPercent: number;
    }> = [];

    for (const inv of investments) {
      const invested = inv.amountInvested || new Decimal(0);
      const shares = inv.sharesOwned || new Decimal(0);
      totalInvested = totalInvested.plus(invested);

      // Determine current value based on latest trade price or original price
      const latestTrade = inv.propertyId
        ? await this.prisma.marketplaceTrade.findFirst({
            where: { propertyId: inv.propertyId, status: 'completed' },
            orderBy: { executedAt: 'desc' },
          })
        : null;

      let currentPrice: Decimal;
      if (latestTrade) {
        currentPrice = latestTrade.pricePerShare;
      } else {
        // Fallback: original price per share = totalValue / 1000
        const propTotal = inv.property?.totalValue || new Decimal(0);
        currentPrice = propTotal.greaterThan(0)
          ? propTotal.dividedBy(AnalyticsService.TOTAL_SHARES)
          : new Decimal(0);
      }

      const holdingValue = shares.times(currentPrice);
      currentPortfolioValue = currentPortfolioValue.plus(holdingValue);

      const gainLossPercent = invested.greaterThan(0)
        ? holdingValue.minus(invested).dividedBy(invested).times(100).toNumber()
        : 0;

      holdingDetails.push({
        propertyId: inv.propertyId!,
        title: inv.property?.title || 'Unknown',
        propertyType: inv.property?.propertyType || 'Unknown',
        invested,
        currentValue: holdingValue,
        sharesOwned: shares,
        gainLossPercent,
      });
    }

    const unrealizedGainLoss = currentPortfolioValue.minus(totalInvested);
    const unrealizedGainLossPercent = totalInvested.greaterThan(0)
      ? unrealizedGainLoss.dividedBy(totalInvested).times(100).toNumber()
      : 0;

    // ---- Diversification score (Herfindahl-Hirschman Index) ----
    // HHI = sum of (weight_i)^2 where weight_i is fraction of portfolio in asset i
    // Normalised score: 1 = fully concentrated, approaching 0 = well diversified
    // We convert to a 0-100 score where 100 = perfectly diversified
    const totalVal = currentPortfolioValue.greaterThan(0)
      ? currentPortfolioValue
      : totalInvested;

    let hhi = 0;
    if (totalVal.greaterThan(0)) {
      for (const h of holdingDetails) {
        const weight = h.currentValue.dividedBy(totalVal).toNumber();
        hhi += weight * weight;
      }
    }

    // HHI ranges from 1/n (perfect diversification) to 1 (single holding)
    const n = holdingDetails.length;
    const minHHI = n > 0 ? 1 / n : 1;
    const diversificationScore =
      n > 1
        ? Math.round(((1 - hhi) / (1 - minHHI)) * 100)
        : 0;

    // ---- Total dividends received ----
    const dividendPayments = await this.prisma.dividendPayment.findMany({
      where: { investorId },
    });

    const totalDividendsReceived = dividendPayments.reduce(
      (sum, p) => sum.plus(p.amountPaid),
      new Decimal(0),
    );

    // ---- Annualized return ----
    // Simple approximation: (current value + dividends - invested) / invested
    // scaled to annual basis using the time since the earliest investment
    const earliestInvestment = investments.reduce(
      (earliest, inv) => {
        const d = inv.investmentDate;
        return d && (!earliest || d < earliest) ? d : earliest;
      },
      null as Date | null,
    );

    let annualizedReturn = 0;
    if (totalInvested.greaterThan(0) && earliestInvestment) {
      const yearsHeld = Math.max(
        (Date.now() - new Date(earliestInvestment).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
        1 / 365, // at least 1 day
      );

      const totalReturn = currentPortfolioValue
        .plus(totalDividendsReceived)
        .minus(totalInvested)
        .dividedBy(totalInvested)
        .toNumber();

      // CAGR-like: ((1 + totalReturn) ^ (1/years)) - 1
      annualizedReturn =
        (Math.pow(1 + totalReturn, 1 / yearsHeld) - 1) * 100;
    }

    // ---- Risk-adjusted return (simplified Sharpe-like ratio) ----
    // Sharpe = (portfolio return - risk-free rate) / portfolio volatility
    // We use 4% as risk-free rate proxy and portfolio std-dev of holding returns
    const riskFreeRate = 4;
    const holdingReturns = holdingDetails.map((h) => h.gainLossPercent);
    const avgReturn =
      holdingReturns.length > 0
        ? holdingReturns.reduce((a, b) => a + b, 0) / holdingReturns.length
        : 0;
    const variance =
      holdingReturns.length > 1
        ? holdingReturns.reduce(
            (sum, r) => sum + Math.pow(r - avgReturn, 2),
            0,
          ) / (holdingReturns.length - 1)
        : 1;
    const stdDev = Math.sqrt(variance) || 1;
    const riskAdjustedReturn = (annualizedReturn - riskFreeRate) / stdDev;

    // ---- Asset allocation by property type ----
    const allocationMap = new Map<string, number>();
    for (const h of holdingDetails) {
      const current = allocationMap.get(h.propertyType) || 0;
      allocationMap.set(h.propertyType, current + h.currentValue.toNumber());
    }

    const totalPortfolioNum = currentPortfolioValue.toNumber() || 1;
    const assetAllocation = Array.from(allocationMap.entries()).map(
      ([type, value]) => ({
        propertyType: type,
        value: Math.round(value * 100) / 100,
        percentage: Math.round((value / totalPortfolioNum) * 10000) / 100,
      }),
    );

    // ---- Top / worst performers ----
    const sorted = [...holdingDetails].sort(
      (a, b) => b.gainLossPercent - a.gainLossPercent,
    );

    const topPerformers = sorted.slice(0, 3).map((h) => ({
      propertyId: h.propertyId,
      title: h.title,
      gainLossPercent: Math.round(h.gainLossPercent * 100) / 100,
      currentValue: h.currentValue.toNumber(),
    }));

    const worstPerformers = sorted
      .slice(-3)
      .reverse()
      .map((h) => ({
        propertyId: h.propertyId,
        title: h.title,
        gainLossPercent: Math.round(h.gainLossPercent * 100) / 100,
        currentValue: h.currentValue.toNumber(),
      }));

    const holdings = holdingDetails.map((h) => ({
      propertyId: h.propertyId,
      title: h.title,
      propertyType: h.propertyType,
      invested: h.invested.toNumber(),
      currentValue: h.currentValue.toNumber(),
      sharesOwned: h.sharesOwned.toNumber(),
      gainLossPercent: Math.round(h.gainLossPercent * 100) / 100,
    }));

    return {
      investorId,
      totalInvested: totalInvested.toNumber(),
      currentPortfolioValue: currentPortfolioValue.toNumber(),
      unrealizedGainLoss: unrealizedGainLoss.toNumber(),
      unrealizedGainLossPercent:
        Math.round(unrealizedGainLossPercent * 100) / 100,
      diversificationScore,
      totalDividendsReceived: totalDividendsReceived.toNumber(),
      annualizedReturn: Math.round(annualizedReturn * 100) / 100,
      riskAdjustedReturn: Math.round(riskAdjustedReturn * 100) / 100,
      assetAllocation,
      topPerformers,
      worstPerformers,
      holdings,
    };
  }

  // ===========================================================================
  // Market Overview
  // ===========================================================================

  async getMarketOverview(query: MarketAnalyticsDto) {
    const timeframe = query.timeframe || 'all';
    const sinceDate = this.resolveTimeframeDate(timeframe);

    // ---- Property filters ----
    const propertyWhere: any = {};
    if (query.propertyType) propertyWhere.propertyType = query.propertyType;
    if (query.city) propertyWhere.city = query.city;

    // ---- Total properties ----
    const totalProperties = await this.prisma.property.count({
      where: propertyWhere,
    });

    // ---- Total funded properties ----
    const totalFunded = await this.prisma.property.count({
      where: { ...propertyWhere, status: 'funded' },
    });

    // ---- Total invested amount ----
    const allInvestments = await this.prisma.investment.findMany({
      where: propertyWhere.propertyType || propertyWhere.city
        ? {
            property: propertyWhere,
          }
        : {},
      select: { amountInvested: true },
    });

    const totalInvestedAmount = allInvestments.reduce(
      (sum, inv) => sum.plus(inv.amountInvested || new Decimal(0)),
      new Decimal(0),
    );

    // ---- Trading volume in timeframe ----
    const tradeWhere: any = { status: 'completed' };
    if (sinceDate) {
      tradeWhere.executedAt = { gte: sinceDate };
    }
    if (propertyWhere.propertyType || propertyWhere.city) {
      tradeWhere.property = propertyWhere;
    }

    const trades = await this.prisma.marketplaceTrade.findMany({
      where: tradeWhere,
      select: { totalPrice: true, propertyId: true },
    });

    const totalTradingVolume = trades.reduce(
      (sum, t) => sum.plus(t.totalPrice),
      new Decimal(0),
    );

    // ---- Average property ROI ----
    const propertiesWithYield = await this.prisma.property.findMany({
      where: propertyWhere,
      select: { expectedReturnsAnnual: true, rentalYield: true },
    });

    const yields = propertiesWithYield
      .map((p) => Number(p.expectedReturnsAnnual || p.rentalYield || 0))
      .filter((y) => y > 0);

    const averageROI =
      yields.length > 0
        ? Math.round(
            (yields.reduce((a, b) => a + b, 0) / yields.length) * 100,
          ) / 100
        : 0;

    // ---- Most active properties (by trade count) ----
    const tradeCountMap = new Map<number, number>();
    for (const t of trades) {
      tradeCountMap.set(t.propertyId, (tradeCountMap.get(t.propertyId) || 0) + 1);
    }

    const sortedByActivity = Array.from(tradeCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const mostActivePropertyIds = sortedByActivity.map(([id]) => id);
    const mostActiveProperties = await this.prisma.property.findMany({
      where: { id: { in: mostActivePropertyIds } },
      select: { id: true, title: true, city: true, propertyType: true },
    });

    const mostActive = sortedByActivity.map(([id, count]) => {
      const prop = mostActiveProperties.find((p) => p.id === id);
      return {
        propertyId: id,
        title: prop?.title || 'Unknown',
        city: prop?.city || 'Unknown',
        propertyType: prop?.propertyType || 'Unknown',
        tradeCount: count,
      };
    });

    // ---- Highest yielding properties ----
    const highYieldProperties = await this.prisma.property.findMany({
      where: {
        ...propertyWhere,
        rentalYield: { not: null },
      },
      orderBy: { rentalYield: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        city: true,
        propertyType: true,
        rentalYield: true,
        expectedReturnsAnnual: true,
      },
    });

    const highestYielding = highYieldProperties.map((p) => ({
      propertyId: p.id,
      title: p.title,
      city: p.city,
      propertyType: p.propertyType,
      rentalYield: p.rentalYield ? Number(p.rentalYield) : 0,
      expectedReturnsAnnual: p.expectedReturnsAnnual
        ? Number(p.expectedReturnsAnnual)
        : 0,
    }));

    // ---- Platform growth: new investments over time (monthly buckets) ----
    const investmentGrowthWhere: any = {};
    if (sinceDate) {
      investmentGrowthWhere.investmentDate = { gte: sinceDate };
    }
    if (propertyWhere.propertyType || propertyWhere.city) {
      investmentGrowthWhere.property = propertyWhere;
    }

    const recentInvestments = await this.prisma.investment.findMany({
      where: investmentGrowthWhere,
      select: {
        amountInvested: true,
        investmentDate: true,
      },
      orderBy: { investmentDate: 'asc' },
    });

    const growthByMonth = new Map<string, { count: number; volume: number }>();
    for (const inv of recentInvestments) {
      const date = inv.investmentDate;
      if (!date) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = growthByMonth.get(key) || { count: 0, volume: 0 };
      existing.count += 1;
      existing.volume += Number(inv.amountInvested || 0);
      growthByMonth.set(key, existing);
    }

    const platformGrowth = Array.from(growthByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        newInvestments: data.count,
        investmentVolume: Math.round(data.volume * 100) / 100,
      }));

    return {
      totalProperties,
      totalFunded,
      totalInvestedAmount: totalInvestedAmount.toNumber(),
      totalTradingVolume: totalTradingVolume.toNumber(),
      totalTradeCount: trades.length,
      averageROI,
      mostActive,
      highestYielding,
      platformGrowth,
      filters: {
        propertyType: query.propertyType || null,
        city: query.city || null,
        timeframe,
      },
    };
  }

  // ===========================================================================
  // Risk Assessment
  // ===========================================================================

  async getRiskAssessment(propertyId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // ---- Market risk (trading price volatility) ----
    const trades = await this.prisma.marketplaceTrade.findMany({
      where: { propertyId, status: 'completed' },
      orderBy: { executedAt: 'desc' },
      select: { pricePerShare: true, executedAt: true },
    });

    let marketRisk = 5; // default medium
    if (trades.length >= 3) {
      const prices = trades.map((t) => Number(t.pricePerShare));
      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance =
        prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
        prices.length;
      const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;

      // Map CV to 1-10: CV of 0 => 1, CV >= 0.5 => 10
      marketRisk = Math.min(10, Math.max(1, Math.round(coefficientOfVariation * 20)));
    } else if (trades.length === 0) {
      marketRisk = 7; // no trades = higher uncertainty
    }

    // ---- Liquidity risk (trade frequency + active listings) ----
    const activeListings = await this.prisma.marketplaceListing.count({
      where: { propertyId, status: 'active' },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTradeCount = await this.prisma.marketplaceTrade.count({
      where: {
        propertyId,
        status: 'completed',
        executedAt: { gte: thirtyDaysAgo },
      },
    });

    // More trades and listings = lower liquidity risk
    let liquidityRisk: number;
    if (recentTradeCount >= 10 && activeListings >= 3) {
      liquidityRisk = 2;
    } else if (recentTradeCount >= 5 || activeListings >= 2) {
      liquidityRisk = 4;
    } else if (recentTradeCount >= 1 || activeListings >= 1) {
      liquidityRisk = 6;
    } else {
      liquidityRisk = 9;
    }

    // ---- Funding risk ----
    const fundingTarget = Number(property.fundingTarget || 0);
    const fundingRaised = Number(property.fundingRaised || 0);
    const fundingProgress =
      fundingTarget > 0 ? (fundingRaised / fundingTarget) * 100 : 0;

    let fundingRisk: number;
    if (fundingProgress >= 100) {
      fundingRisk = 1;
    } else if (fundingProgress >= 75) {
      fundingRisk = 3;
    } else if (fundingProgress >= 50) {
      fundingRisk = 5;
    } else if (fundingProgress >= 25) {
      fundingRisk = 7;
    } else {
      fundingRisk = 9;
    }

    // ---- Income risk (dividend consistency) ----
    const dividends = await this.prisma.dividend.findMany({
      where: { propertyId },
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    });

    let incomeRisk: number;
    if (dividends.length >= 4) {
      // Check if all recent dividends have positive net income
      const recentDivs = dividends.slice(0, 4);
      const allPositive = recentDivs.every(
        (d) => d.netIncome && new Decimal(d.netIncome).greaterThan(0),
      );
      incomeRisk = allPositive ? 2 : 5;
    } else if (dividends.length >= 1) {
      incomeRisk = 5;
    } else {
      incomeRisk = 8;
    }

    // ---- Overall risk score (weighted average) ----
    const overallRisk = Math.round(
      marketRisk * 0.3 +
        liquidityRisk * 0.2 +
        fundingRisk * 0.25 +
        incomeRisk * 0.25,
    );

    const clampedOverall = Math.min(10, Math.max(1, overallRisk));

    let riskCategory: string;
    if (clampedOverall <= 3) {
      riskCategory = 'Low';
    } else if (clampedOverall <= 6) {
      riskCategory = 'Medium';
    } else {
      riskCategory = 'High';
    }

    return {
      propertyId,
      title: property.title,
      marketRisk: {
        score: marketRisk,
        label: this.riskLabel(marketRisk),
        detail: `Based on ${trades.length} historical trade(s) and price volatility`,
      },
      liquidityRisk: {
        score: liquidityRisk,
        label: this.riskLabel(liquidityRisk),
        detail: `${recentTradeCount} trade(s) in last 30 days, ${activeListings} active listing(s)`,
      },
      fundingRisk: {
        score: fundingRisk,
        label: this.riskLabel(fundingRisk),
        detail: `${Math.round(fundingProgress)}% funded (${fundingRaised} / ${fundingTarget})`,
      },
      incomeRisk: {
        score: incomeRisk,
        label: this.riskLabel(incomeRisk),
        detail: `${dividends.length} dividend distribution(s) on record`,
      },
      overallRiskScore: clampedOverall,
      riskCategory,
      weights: {
        marketRisk: 0.3,
        liquidityRisk: 0.2,
        fundingRisk: 0.25,
        incomeRisk: 0.25,
      },
    };
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Compute a simple composite risk score (1-10) for a property.
   * Lower = safer, higher = riskier.
   */
  private computePropertyRiskScore(params: {
    fundingProgress: number;
    hasDividends: boolean;
    tradingVolume: number;
    rentalYield: number;
  }): number {
    // Funding factor: fully funded = 1 (low risk), unfunded = 10 (high risk)
    const fundingFactor =
      params.fundingProgress >= 100
        ? 1
        : Math.max(1, 10 - Math.floor(params.fundingProgress / 12));

    // Dividend factor: has dividends = 2, no dividends = 8
    const dividendFactor = params.hasDividends ? 2 : 8;

    // Volume factor: more volume = lower risk
    let volumeFactor: number;
    if (params.tradingVolume >= 20) {
      volumeFactor = 2;
    } else if (params.tradingVolume >= 10) {
      volumeFactor = 4;
    } else if (params.tradingVolume >= 3) {
      volumeFactor = 6;
    } else {
      volumeFactor = 8;
    }

    // Rental yield factor: higher yield = lower risk
    let yieldFactor: number;
    if (params.rentalYield >= 8) {
      yieldFactor = 2;
    } else if (params.rentalYield >= 5) {
      yieldFactor = 4;
    } else if (params.rentalYield >= 2) {
      yieldFactor = 6;
    } else {
      yieldFactor = 8;
    }

    // Weighted average: funding 30%, dividend 25%, volume 20%, yield 25%
    const score = Math.round(
      fundingFactor * 0.3 +
        dividendFactor * 0.25 +
        volumeFactor * 0.2 +
        yieldFactor * 0.25,
    );

    return Math.min(10, Math.max(1, score));
  }

  /** Convert a 1-10 score to a human-readable label. */
  private riskLabel(score: number): string {
    if (score <= 3) return 'Low';
    if (score <= 6) return 'Medium';
    return 'High';
  }

  /** Generate a simple text recommendation. */
  private generateRecommendation(
    riskScore: number,
    priceChange: number,
    dividendYield: number,
    fundingProgress: number,
  ): string {
    if (riskScore <= 3 && dividendYield >= 4 && fundingProgress >= 90) {
      return 'Strong Buy - Low risk with solid income and near-full funding';
    }
    if (riskScore <= 3 && priceChange > 0) {
      return 'Buy - Low risk with positive price momentum';
    }
    if (riskScore <= 5 && dividendYield >= 3) {
      return 'Buy - Moderate risk offset by good dividend yield';
    }
    if (riskScore <= 5) {
      return 'Hold - Moderate risk; monitor performance';
    }
    if (riskScore <= 7 && priceChange > 5) {
      return 'Hold - Higher risk but positive price trend';
    }
    if (riskScore <= 7) {
      return 'Caution - Elevated risk; review before investing';
    }
    return 'High Risk - Significant uncertainty; invest with caution';
  }

  /** Resolve a timeframe string to a Date cutoff. */
  private resolveTimeframeDate(timeframe: string): Date | null {
    const now = new Date();
    switch (timeframe) {
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return null;
    }
  }
}
