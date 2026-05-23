import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { type Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UserRole, AuditAction } from '@givar/database';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { IsOptional, IsNumber, Max, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuditQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Max(100, { message: 'Limit cannot exceed 100 to prevent system overload' })
  limit?: number = 20;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

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
  async getLogs(@Query() query: AuditQueryDto) {
    return this.auditService.getLogs({
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      search: query.search,
      action: query.action,
      startDate: query.startDate,
      endDate: query.endDate
    });
  }

  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('export')
  async exportLogs(
    @Query() query: AuditQueryDto,
    @Res() res?: Response,
  ) {
    const csv = await this.auditService.exportLogs({
      userId: query.userId,
      search: query.search,
      action: query.action,
      startDate: query.startDate,
      endDate: query.endDate
    });
    const timestamp = new Date().toISOString().split('T')[0];

    res!.header('Content-Type', 'text/csv');
    res!.attachment(`givar-audit-logs-${timestamp}.csv`);
    return res!.send(csv);
  }
}