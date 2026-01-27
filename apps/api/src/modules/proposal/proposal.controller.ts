import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StorageService } from '../storage/storage.service';
import { GetUploadUrlDto } from './dto/upload.dto';
import { ProposalService } from './proposal.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposal.dto';
import { UserRole } from '@givar/database';

@Controller('proposals')
@UseGuards(AuthGuard('jwt'))
export class ProposalController {
  constructor(
    private readonly storage: StorageService,
    private readonly service: ProposalService,
  ) {}

  @Post('upload-url')
  async getUploadUrl(@Req() req: any, @Body() dto: GetUploadUrlDto) {
    return this.storage.getPresignedUploadUrl(req.user.id, dto.fileType, dto.useCase);
  }

  @Get('preview-url')
  async getPreviewUrl(
    @Req() req: any,
    @Query('key') key: string,
    @Query('proposalId') proposalId: string,
  ) {
    if (!key || !proposalId) {
      throw new BadRequestException('File key and proposal context are required');
    }

    if (req.user.role !== UserRole.ADMIN) {
        await this.service.verifyOwnership(proposalId, req.user.id);
        
        if (!key.startsWith(`proposals/${req.user.id}/`)) {
            throw new ForbiddenException('Invalid file key path.');
        }
    }
    return this.storage.getPresignedViewUrl(key);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateProposalDto) {
    return this.service.createDraft(req.user.id, dto);
  }

  @Get()
  getMyProposals(@Req() req: any) {
    return this.service.getMyProposals(req.user.id);
  }

  @Get(':id')
  getOne(@Req() req: any, @Param('id') id: string) {
    return this.service.getOne(req.user.id, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProposalDto) {
    return this.service.updateDraft(req.user.id, id, dto);
  }

  @Patch(':id/submit')
  submit(@Req() req: any, @Param('id') id: string) {
    return this.service.submitProposal(req.user.id, id);
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteProposal(req.user.id, id);
  }
}