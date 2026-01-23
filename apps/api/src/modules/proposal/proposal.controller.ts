import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StorageService } from '../storage/storage.service';
import { GetUploadUrlDto } from './dto/upload.dto';
import { ProposalService } from './proposal.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposal.dto';

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
}