import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StorageService } from '../storage/storage.service';
import { GetUploadUrlDto } from './dto/upload.dto';
import { ProposalService } from './proposal.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposal.dto';
import { UserRole, AuditAction } from '@givar/database';
import { AuditService } from '../audit/audit.service';

@Controller('proposals')
@UseGuards(AuthGuard('jwt'))
export class ProposalController {
  constructor(
    private readonly storage: StorageService,
    private readonly service: ProposalService,
    private readonly audit: AuditService,
  ) { }

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

    // 1. Admin Bypass (No audit needed for admin viewing their own/users docs usually, or audit separately)
    if (req.user.role === UserRole.ADMIN) {
      return this.storage.getPresignedViewUrl(key);
    }

    // 2. Ownership Verification
    await this.service.verifyOwnership(proposalId, req.user.id);

    // 3. Path Isolation OR Ledger Verification
    const isUserPath = key.startsWith(`proposals/${req.user.id}/`);

    if (!isUserPath) {
      const assetContext = await this.service.getAssetContext(proposalId, key);

      if (!assetContext.valid) {
        throw new ForbiddenException('Invalid file key path or asset not found in project ledger.');
      }

      // 4. Enhanced Forensic Logging
      await this.audit.log({
        userId: req.user.id,
        action: AuditAction.RECEIPT_VIEWED,
        entityId: proposalId,
        entityType: 'Project',
        metadata: {
          fileKey: key,
          reason: 'Project Owner reviewed secure asset',
          projectId: proposalId,
          projectName: assetContext.title,
          projectPhase: assetContext.phase,
          assetType: assetContext.type
        },
        req
      });
    }

    // 5. Grant Access
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

  @Patch(':id/defer')
  defer(@Req() req: any, @Param('id') id: string) {
    return this.service.deferProposal(req.user.id, id);
  }
}