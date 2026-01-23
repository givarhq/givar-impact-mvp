import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@givar/database';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin/audit') 
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // Only Admins can view the audit trail
  @Roles(UserRole.ADMIN)
  @Get()
  async getLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
  ) {
    return this.auditService.getLogs({ 
      page: page ? Number(page) : 1, 
      limit: limit ? Number(limit) : 20, 
      userId 
    });
  }
}