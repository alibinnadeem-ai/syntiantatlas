import {
  Controller,
  Get,
  Post,
  Body,
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
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GovernanceService } from './governance.service';
import { CreateProposalDto, CastVoteDto } from './dto/governance.dto';

@ApiTags('governance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  // ---------------------------------------------------------------------------
  // List proposals (optionally filter by status)
  // ---------------------------------------------------------------------------

  @Get('proposals')
  @ApiOperation({ summary: 'List governance proposals' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'passed', 'failed', 'executed', 'cancelled'],
  })
  async getProposals(@Query('status') status?: string) {
    return this.governanceService.getProposals(status);
  }

  // ---------------------------------------------------------------------------
  // Get single proposal
  // ---------------------------------------------------------------------------

  @Get('proposals/:id')
  @ApiOperation({ summary: 'Get a governance proposal by ID' })
  @ApiParam({ name: 'id', type: Number })
  async getProposal(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.governanceService.getProposal(id, user.id);
  }

  // ---------------------------------------------------------------------------
  // Get current user's votes
  // ---------------------------------------------------------------------------

  @Get('votes/me')
  @ApiOperation({ summary: 'Get current user\'s governance votes' })
  async getMyVotes(@CurrentUser() user: any) {
    return this.governanceService.getMyVotes(user.id);
  }

  // ---------------------------------------------------------------------------
  // Create a proposal
  // ---------------------------------------------------------------------------

  @Post('proposals')
  @ApiOperation({ summary: 'Create a governance proposal (investors only)' })
  async createProposal(
    @Body() dto: CreateProposalDto,
    @CurrentUser() user: any,
  ) {
    return this.governanceService.createProposal(user.id, dto);
  }

  // ---------------------------------------------------------------------------
  // Cast a vote
  // ---------------------------------------------------------------------------

  @Post('proposals/:id/vote')
  @ApiOperation({ summary: 'Cast a vote on a proposal' })
  @ApiParam({ name: 'id', type: Number })
  async castVote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CastVoteDto,
    @CurrentUser() user: any,
  ) {
    return this.governanceService.castVote(id, user.id, dto.vote);
  }

  // ---------------------------------------------------------------------------
  // Execute a passed proposal
  // ---------------------------------------------------------------------------

  @Post('proposals/:id/execute')
  @ApiOperation({ summary: 'Execute a passed proposal (proposer or admin)' })
  @ApiParam({ name: 'id', type: Number })
  async executeProposal(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.governanceService.executeProposal(id, user.id);
  }

  // ---------------------------------------------------------------------------
  // Cancel a proposal
  // ---------------------------------------------------------------------------

  @Post('proposals/:id/cancel')
  @ApiOperation({ summary: 'Cancel an active proposal (proposer or admin)' })
  @ApiParam({ name: 'id', type: Number })
  async cancelProposal(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.governanceService.cancelProposal(id, user.id);
  }
}
