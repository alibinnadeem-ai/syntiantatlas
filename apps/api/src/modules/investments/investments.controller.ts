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
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvestmentsService } from './investments.service';
import { InvestDto } from './dto/investments.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Request } from 'express';

@ApiTags('Investments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('investor')
  @ApiOperation({ summary: 'Invest in a property' })
  async invest(
    @Body() dto: InvestDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.investmentsService.invest(dto, user.id, req.ip);
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Get investor portfolio' })
  async getPortfolio(@CurrentUser() user: any) {
    return this.investmentsService.getPortfolio(user.id);
  }

  @Get('property/:id')
  @ApiOperation({ summary: 'Get all investments for a property' })
  async getPropertyInvestments(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.getPropertyInvestments(id);
  }
}
