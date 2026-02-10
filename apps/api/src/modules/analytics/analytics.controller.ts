import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { MarketAnalyticsDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ---------------------------------------------------------------------------
  // Property Valuation
  // ---------------------------------------------------------------------------

  @Get('property/:propertyId/valuation')
  @ApiOperation({
    summary: 'Get AI-powered property valuation and risk assessment',
  })
  @ApiParam({ name: 'propertyId', type: Number })
  async getPropertyValuation(
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    return this.analyticsService.getPropertyValuation(propertyId);
  }

  // ---------------------------------------------------------------------------
  // Portfolio Analysis — current user
  // ---------------------------------------------------------------------------

  @Get('portfolio')
  @ApiOperation({
    summary: 'Get portfolio analysis for the authenticated user',
  })
  async getMyPortfolioAnalysis(@CurrentUser() user: any) {
    return this.analyticsService.getPortfolioAnalysis(user.id);
  }

  // ---------------------------------------------------------------------------
  // Portfolio Analysis — specific investor (admin only)
  // ---------------------------------------------------------------------------

  @Get('portfolio/:investorId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Get portfolio analysis for a specific investor (admin only)',
  })
  @ApiParam({ name: 'investorId', type: Number })
  async getInvestorPortfolioAnalysis(
    @Param('investorId', ParseIntPipe) investorId: number,
  ) {
    return this.analyticsService.getPortfolioAnalysis(investorId);
  }

  // ---------------------------------------------------------------------------
  // Market Overview
  // ---------------------------------------------------------------------------

  @Get('market')
  @ApiOperation({
    summary: 'Get platform-wide market analytics with optional filters',
  })
  async getMarketOverview(@Query() query: MarketAnalyticsDto) {
    return this.analyticsService.getMarketOverview(query);
  }

  // ---------------------------------------------------------------------------
  // Risk Assessment
  // ---------------------------------------------------------------------------

  @Get('risk/:propertyId')
  @ApiOperation({ summary: 'Get detailed risk breakdown for a property' })
  @ApiParam({ name: 'propertyId', type: Number })
  async getRiskAssessment(
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    return this.analyticsService.getRiskAssessment(propertyId);
  }
}
