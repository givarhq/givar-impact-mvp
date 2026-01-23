import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StorageService } from '../storage/storage.service';
import { GetUploadUrlDto } from './dto/upload.dto';

@Controller('proposals')
@UseGuards(AuthGuard('jwt'))
export class ProposalController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload-url')
  async getUploadUrl(@Req() req: any, @Body() dto: GetUploadUrlDto) {
    return this.storage.getPresignedUploadUrl(
      req.user.id,
      dto.fileType,
      dto.useCase
    );
  }
}