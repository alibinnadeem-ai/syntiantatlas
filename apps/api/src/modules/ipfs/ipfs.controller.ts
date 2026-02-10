import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
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
import { IpfsService } from './ipfs.service';
import { UploadDocumentDto, QueryDocumentsDto } from './dto/ipfs.dto';

@ApiTags('IPFS Document Storage')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/ipfs')
export class IpfsController {
  constructor(private readonly ipfsService: IpfsService) {}

  // ---------------------------------------------------------------------------
  // Upload document (admin only)
  // ---------------------------------------------------------------------------

  @Post('upload')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Upload a document to IPFS (admin only)',
    description:
      'Accepts JSON with base64-encoded content. Stores on IPFS if available, otherwise uses mock CID fallback.',
  })
  async uploadDocument(
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: any,
  ) {
    // Decode base64 content to buffer (or use empty buffer if none provided)
    const buffer = dto.content
      ? Buffer.from(dto.content, 'base64')
      : Buffer.from('');

    const uploadResult = await this.ipfsService.uploadToIpfs(
      buffer,
      dto.filename,
    );

    const record = await this.ipfsService.storeDocumentRecord(
      dto,
      uploadResult.cid,
      uploadResult.size,
      user.id,
    );

    return {
      message: 'Document uploaded successfully',
      document: record,
    };
  }

  // ---------------------------------------------------------------------------
  // List documents with filters (authenticated)
  // ---------------------------------------------------------------------------

  @Get('documents')
  @ApiOperation({
    summary: 'List stored documents with optional filters',
  })
  async getDocuments(@Query() query: QueryDocumentsDto) {
    return this.ipfsService.getDocuments(query);
  }

  // ---------------------------------------------------------------------------
  // Get document by CID (authenticated)
  // ---------------------------------------------------------------------------

  @Get('documents/:cid')
  @ApiOperation({
    summary: 'Get document information by CID',
  })
  @ApiParam({ name: 'cid', type: String, description: 'IPFS Content Identifier' })
  async getDocumentByCid(@Param('cid') cid: string) {
    return this.ipfsService.getDocumentByCid(cid);
  }
}
