import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateListingDto,
  BuySharesDto,
  QueryListingsDto,
} from './dto/marketplace.dto';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  /** Default platform fee: 250 basis points = 2.5% */
  private static readonly DEFAULT_FEE_BPS = 250;
  private static readonly BPS_DIVISOR = 10000;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Create Listing
  // ---------------------------------------------------------------------------

  async createListing(dto: CreateListingDto, sellerId: number, ip?: string) {
    const shares = new Decimal(dto.shares);
    const pricePerShare = new Decimal(dto.pricePerShare);

    // Validate the seller actually owns enough un-listed shares
    const investments = await this.prisma.investment.findMany({
      where: { investorId: sellerId, propertyId: dto.propertyId },
    });

    const totalOwned = investments.reduce(
      (sum, inv) => sum.plus(inv.sharesOwned || new Decimal(0)),
      new Decimal(0),
    );

    // Subtract shares already on active listings for this property
    const activeListings = await this.prisma.marketplaceListing.findMany({
      where: {
        sellerId,
        propertyId: dto.propertyId,
        status: 'active',
      },
    });

    const alreadyListed = activeListings.reduce(
      (sum, l) => sum.plus(l.sharesRemaining),
      new Decimal(0),
    );

    const available = totalOwned.minus(alreadyListed);

    if (shares.greaterThan(available)) {
      throw new BadRequestException(
        `Insufficient shares. You have ${available} available shares for this property`,
      );
    }

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        propertyId: dto.propertyId,
        sellerId,
        sharesListed: shares,
        sharesRemaining: shares,
        pricePerShare,
        status: 'active',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        property: {
          select: { id: true, title: true, city: true, propertyType: true },
        },
      },
    });

    await this.auditService.log({
      userId: sellerId,
      action: 'create_listing',
      entityType: 'marketplace_listing',
      entityId: listing.id,
      details: {
        propertyId: dto.propertyId,
        shares: dto.shares,
        pricePerShare: dto.pricePerShare,
      },
      ipAddress: ip,
    });

    this.logger.log(
      `Listing ${listing.id} created by user ${sellerId}: ${dto.shares} shares @ ${dto.pricePerShare}/share`,
    );

    return listing;
  }

  // ---------------------------------------------------------------------------
  // Buy Shares
  // ---------------------------------------------------------------------------

  async buyShares(dto: BuySharesDto, buyerId: number, ip?: string) {
    const sharesToBuy = new Decimal(dto.shares);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Fetch and validate listing
      const listing = await tx.marketplaceListing.findUnique({
        where: { id: dto.listingId },
        include: {
          property: { select: { id: true, title: true } },
        },
      });

      if (!listing) {
        throw new NotFoundException('Listing not found');
      }

      if (listing.status !== 'active') {
        throw new BadRequestException('Listing is no longer active');
      }

      if (listing.expiresAt && new Date(listing.expiresAt) < new Date()) {
        throw new BadRequestException('Listing has expired');
      }

      // 2. Buyer cannot be the seller
      if (listing.sellerId === buyerId) {
        throw new BadRequestException('You cannot buy your own listing');
      }

      // 3. Validate enough shares available
      if (sharesToBuy.greaterThan(listing.sharesRemaining)) {
        throw new BadRequestException(
          `Only ${listing.sharesRemaining} shares available on this listing`,
        );
      }

      // 4. Calculate costs
      const pricePerShare = listing.pricePerShare;
      const totalPrice = sharesToBuy.times(pricePerShare);

      // 5. Look up platform fee from system_settings (or default)
      const feeSetting = await tx.systemSetting.findUnique({
        where: { key: 'marketplace_fee_bps' },
      });

      const feeBps = feeSetting
        ? parseInt(feeSetting.value, 10)
        : MarketplaceService.DEFAULT_FEE_BPS;

      const platformFee = totalPrice
        .times(feeBps)
        .dividedBy(MarketplaceService.BPS_DIVISOR);

      const sellerProceeds = totalPrice.minus(platformFee);

      // 6. Validate buyer wallet balance
      const buyer = await tx.user.findUnique({
        where: { id: buyerId },
      });

      if (!buyer) {
        throw new NotFoundException('Buyer not found');
      }

      const buyerBalance = buyer.walletBalance || new Decimal(0);
      if (buyerBalance.lessThan(totalPrice)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // 7. Deduct from buyer wallet
      await tx.user.update({
        where: { id: buyerId },
        data: { walletBalance: { decrement: totalPrice } },
      });

      // 8. Credit seller wallet (totalPrice - platformFee)
      await tx.user.update({
        where: { id: listing.sellerId },
        data: { walletBalance: { increment: sellerProceeds } },
      });

      // 9. Reduce listing sharesRemaining, mark as sold if 0
      const newRemaining = listing.sharesRemaining.minus(sharesToBuy);
      const newStatus = newRemaining.lessThanOrEqualTo(0) ? 'sold' : 'active';

      await tx.marketplaceListing.update({
        where: { id: listing.id },
        data: {
          sharesRemaining: newRemaining,
          status: newStatus,
        },
      });

      // 10. Create MarketplaceTrade record
      const trade = await tx.marketplaceTrade.create({
        data: {
          listingId: listing.id,
          propertyId: listing.propertyId,
          buyerId,
          sellerId: listing.sellerId,
          sharesBought: sharesToBuy,
          pricePerShare,
          totalPrice,
          platformFee,
          status: 'completed',
          executedAt: new Date(),
        },
      });

      // 11. Update buyer's investment (create or increment)
      const buyerInvestment = await tx.investment.findFirst({
        where: { investorId: buyerId, propertyId: listing.propertyId },
      });

      if (buyerInvestment) {
        await tx.investment.update({
          where: { id: buyerInvestment.id },
          data: {
            sharesOwned: (buyerInvestment.sharesOwned || new Decimal(0)).plus(
              sharesToBuy,
            ),
          },
        });
      } else {
        await tx.investment.create({
          data: {
            investorId: buyerId,
            propertyId: listing.propertyId,
            amountInvested: totalPrice,
            sharesOwned: sharesToBuy,
            ownershipPercentage: new Decimal(0), // will be recalculated
          },
        });
      }

      // 12. Decrement seller's investment sharesOwned
      const sellerInvestment = await tx.investment.findFirst({
        where: { investorId: listing.sellerId, propertyId: listing.propertyId },
      });

      if (sellerInvestment) {
        const newSellerShares = (
          sellerInvestment.sharesOwned || new Decimal(0)
        ).minus(sharesToBuy);

        await tx.investment.update({
          where: { id: sellerInvestment.id },
          data: { sharesOwned: newSellerShares },
        });
      }

      // 13. Create Transaction records
      await tx.transaction.create({
        data: {
          userId: buyerId,
          type: 'investment',
          amount: totalPrice,
          status: 'completed',
          description: `Marketplace purchase: ${sharesToBuy} shares of ${listing.property.title}`,
          referenceNumber: `MKT-BUY-${trade.id}`,
        },
      });

      await tx.transaction.create({
        data: {
          userId: listing.sellerId,
          type: 'sale',
          amount: sellerProceeds,
          status: 'completed',
          description: `Marketplace sale: ${sharesToBuy} shares of ${listing.property.title}`,
          referenceNumber: `MKT-SELL-${trade.id}`,
        },
      });

      return {
        trade,
        listing: { id: listing.id, status: newStatus },
        property: listing.property,
        totalPrice,
        platformFee,
        sellerProceeds,
      };
    });

    // Send notifications outside the transaction
    try {
      await this.notificationsService.create(
        buyerId,
        'marketplace_purchase',
        'Shares Purchased',
        `You purchased ${dto.shares} shares of ${result.property.title} for $${result.totalPrice}.`,
        {
          tradeId: result.trade.id,
          listingId: dto.listingId,
          propertyId: result.property.id,
          shares: dto.shares,
          totalPrice: result.totalPrice.toString(),
        },
      );
    } catch (error: any) {
      this.logger.warn(
        `Failed to send purchase notification to buyer ${buyerId}: ${error?.message}`,
      );
    }

    try {
      await this.notificationsService.create(
        result.trade.sellerId,
        'marketplace_sale',
        'Shares Sold',
        `Your ${dto.shares} shares of ${result.property.title} were sold for $${result.sellerProceeds}.`,
        {
          tradeId: result.trade.id,
          listingId: dto.listingId,
          propertyId: result.property.id,
          shares: dto.shares,
          sellerProceeds: result.sellerProceeds.toString(),
        },
      );
    } catch (error: any) {
      this.logger.warn(
        `Failed to send sale notification to seller ${result.trade.sellerId}: ${error?.message}`,
      );
    }

    // Audit log
    await this.auditService.log({
      userId: buyerId,
      action: 'buy_shares',
      entityType: 'marketplace_trade',
      entityId: result.trade.id,
      details: {
        listingId: dto.listingId,
        shares: dto.shares,
        totalPrice: result.totalPrice.toString(),
        platformFee: result.platformFee.toString(),
      },
      ipAddress: ip,
    });

    this.logger.log(
      `Trade ${result.trade.id}: buyer ${buyerId} purchased ${dto.shares} shares from listing ${dto.listingId}`,
    );

    return result;
  }

  // ---------------------------------------------------------------------------
  // Cancel Listing
  // ---------------------------------------------------------------------------

  async cancelListing(listingId: number, userId: number, userRole: string, ip?: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== 'active') {
      throw new BadRequestException('Listing is not active');
    }

    // Only the seller or an admin can cancel
    if (listing.sellerId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only cancel your own listings');
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { status: 'cancelled' },
    });

    await this.auditService.log({
      userId,
      action: 'cancel_listing',
      entityType: 'marketplace_listing',
      entityId: listingId,
      details: { previousStatus: listing.status },
      ipAddress: ip,
    });

    this.logger.log(`Listing ${listingId} cancelled by user ${userId}`);

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Get Listings (paginated, filtered)
  // ---------------------------------------------------------------------------

  async getListings(query: QueryListingsDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    if (query.sellerId) where.sellerId = query.sellerId;

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (query.sortBy) {
      case 'price_asc':
        orderBy = { pricePerShare: 'asc' };
        break;
      case 'price_desc':
        orderBy = { pricePerShare: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
    }

    const [data, total] = await Promise.all([
      this.prisma.marketplaceListing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              propertyType: true,
              totalValue: true,
            },
          },
          seller: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.marketplaceListing.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Get Listing By ID
  // ---------------------------------------------------------------------------

  async getListingById(id: number) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            propertyType: true,
            totalValue: true,
            fundingTarget: true,
            fundingRaised: true,
          },
        },
        seller: {
          select: { id: true, firstName: true, lastName: true },
        },
        trades: {
          include: {
            buyer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  // ---------------------------------------------------------------------------
  // Get User Listings
  // ---------------------------------------------------------------------------

  async getUserListings(userId: number) {
    const listings = await this.prisma.marketplaceListing.findMany({
      where: { sellerId: userId },
      include: {
        property: {
          select: { id: true, title: true, city: true, propertyType: true },
        },
        trades: {
          select: { id: true, sharesBought: true, totalPrice: true, executedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return listings;
  }

  // ---------------------------------------------------------------------------
  // Get User Trades
  // ---------------------------------------------------------------------------

  async getUserTrades(userId: number) {
    const trades = await this.prisma.marketplaceTrade.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        listing: {
          select: { id: true, pricePerShare: true },
        },
        property: {
          select: { id: true, title: true, city: true, propertyType: true },
        },
        buyer: {
          select: { id: true, firstName: true, lastName: true },
        },
        seller: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { executedAt: 'desc' },
    });

    return trades;
  }

  // ---------------------------------------------------------------------------
  // Property Market Stats
  // ---------------------------------------------------------------------------

  async getPropertyMarketStats(propertyId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Active listings count
    const activeListings = await this.prisma.marketplaceListing.count({
      where: { propertyId, status: 'active' },
    });

    // Total volume and average price from completed trades
    const trades = await this.prisma.marketplaceTrade.findMany({
      where: { propertyId, status: 'completed' },
      select: { totalPrice: true, pricePerShare: true },
    });

    const totalVolume = trades.reduce(
      (sum, t) => sum.plus(t.totalPrice),
      new Decimal(0),
    );

    const averagePrice =
      trades.length > 0
        ? trades
            .reduce((sum, t) => sum.plus(t.pricePerShare), new Decimal(0))
            .dividedBy(trades.length)
        : new Decimal(0);

    // Lowest ask from active listings
    const lowestListing = await this.prisma.marketplaceListing.findFirst({
      where: { propertyId, status: 'active' },
      orderBy: { pricePerShare: 'asc' },
      select: { pricePerShare: true },
    });

    const lowestAsk = lowestListing ? lowestListing.pricePerShare : null;

    return {
      propertyId,
      activeListings,
      totalVolume,
      averagePrice,
      lowestAsk,
      tradeCount: trades.length,
    };
  }
}
