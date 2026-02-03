import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, VerificationStatus } from '@givar/database';
import { OrganizationService } from './organization.service';
import { OrganizationQueryDto } from './dto/organization-query.dto';

@Controller('organizations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrganizationController {
  constructor(private service: OrganizationService) { }

  // USER: Submit for verification
  @Post('verify')
  submit(@Req() req: any, @Body() body: any) {
    return this.service.submitKyc(req.user.id, body);
  }

  // USER: Get own profile status
  @Get('me')
  getOwnProfile(@Req() req: any) {
    return this.service.getProfileByUserId(req.user.id);
  }


  // ADMIN: List queue
  @Roles(UserRole.ADMIN)
  @Get('admin/pending')
  getPending() {
    return this.service.getPendingVerifications();
  }

  // ADMIN: Approve/Reject
  @Roles(UserRole.ADMIN)
  @Patch('admin/review/:id')
  review(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { status: VerificationStatus, feedback?: string }
  ) {
    return this.service.reviewVerification(id, req.user.id, body.status, body.feedback);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/list')
  async getAll(@Query() query: OrganizationQueryDto) {
    return this.service.findAllAdvanced(query);
  }
}