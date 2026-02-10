import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { DividendsService } from './dividends.service';
import { CreateDividendDto } from './dto/dividends.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Request } from 'express';

@ApiTags('Dividends')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/dividends')
export class DividendsController {
  constructor(private readonly dividendsService: DividendsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create and distribute a quarterly dividend (admin only)' })
  async createAndDistribute(
    @Body() dto: CreateDividendDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.dividendsService.createAndDistribute(dto, user.id, req.ip);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get all dividends for a property' })
  @ApiParam({ name: 'propertyId', type: Number })
  async getDividendsByProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    return this.dividendsService.getDividendsByProperty(propertyId);
  }

  @Get('investor/me')
  @ApiOperation({ summary: 'Get current user dividend payments' })
  async getMyDividends(@CurrentUser() user: any) {
    return this.dividendsService.getInvestorDividends(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dividend details by ID' })
  @ApiParam({ name: 'id', type: Number })
  async getDividendDetails(@Param('id', ParseIntPipe) id: number) {
    return this.dividendsService.getDividendDetails(id);
  }
}
