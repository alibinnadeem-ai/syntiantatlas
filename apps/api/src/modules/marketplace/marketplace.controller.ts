import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MarketplaceService } from './marketplace.service';
import {
  CreateListingDto,
  BuySharesDto,
  QueryListingsDto,
} from './dto/marketplace.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Marketplace')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('listings')
  @ApiOperation({ summary: 'Create a new share listing on the marketplace' })
  async createListing(
    @Body() dto: CreateListingDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.marketplaceService.createListing(dto, user.id, req.ip);
  }

  @Post('buy')
  @ApiOperation({ summary: 'Buy shares from a marketplace listing' })
  async buyShares(
    @Body() dto: BuySharesDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.marketplaceService.buyShares(dto, user.id, req.ip);
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Cancel a marketplace listing (owner or admin)' })
  @ApiParam({ name: 'id', type: Number })
  async cancelListing(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.marketplaceService.cancelListing(id, user.id, user.roleId, req.ip);
  }

  @Get('listings')
  @ApiOperation({ summary: 'Get marketplace listings with filters' })
  async getListings(@Query() query: QueryListingsDto) {
    return this.marketplaceService.getListings(query);
  }

  @Get('my/listings')
  @ApiOperation({ summary: 'Get current user marketplace listings' })
  async getMyListings(@CurrentUser() user: any) {
    return this.marketplaceService.getUserListings(user.id);
  }

  @Get('my/trades')
  @ApiOperation({ summary: 'Get current user marketplace trades' })
  async getMyTrades(@CurrentUser() user: any) {
    return this.marketplaceService.getUserTrades(user.id);
  }

  @Get('stats/:propertyId')
  @ApiOperation({ summary: 'Get marketplace stats for a property' })
  @ApiParam({ name: 'propertyId', type: Number })
  async getPropertyMarketStats(
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    return this.marketplaceService.getPropertyMarketStats(propertyId);
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get marketplace listing details' })
  @ApiParam({ name: 'id', type: Number })
  async getListingById(@Param('id', ParseIntPipe) id: number) {
    return this.marketplaceService.getListingById(id);
  }
}
