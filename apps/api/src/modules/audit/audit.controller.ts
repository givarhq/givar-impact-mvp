import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { type Response } from 'express';
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
  constructor(private readonly auditService: AuditService) { }

  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('summary')
  async getSummary() {
    return this.auditService.getAuditSummary();
  }

  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
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

  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('export')
  async exportLogs(
    @Query('userId') userId?: string,
    @Query('search') search?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.auditService.exportLogs({
      userId,
      search,
      action,
      startDate,
      endDate
    });
    const timestamp = new Date().toISOString().split('T')[0];

    res!.header('Content-Type', 'text/csv');
    res!.attachment(`givar-audit-logs-${timestamp}.csv`);
    return res!.send(csv);
  }
}