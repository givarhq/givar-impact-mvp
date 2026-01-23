import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole, AuditAction } from '@givar/database';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('admin/audit') 
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Roles(UserRole.ADMIN)
  @Get('summary')
  async getSummary() {
    return this.auditService.getAuditSummary();
  }

  @Roles(UserRole.ADMIN)
  @Get()
  async getLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('search') search?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getLogs({ 
      page: page ? Number(page) : 1, 
      limit: limit ? Number(limit) : 20, 
      userId,
      search,
      action,
      startDate,
      endDate
    });
  }
}