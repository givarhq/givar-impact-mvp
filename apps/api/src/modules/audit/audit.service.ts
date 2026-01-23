import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditAction, Prisma } from '@givar/database';
import { Request } from 'express';
import { subHours, startOfDay, endOfDay } from 'date-fns';

interface CreateLogParams {
  userId?: string;
  action: AuditAction;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  req?: Request;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: CreateLogParams, tx?: Prisma.TransactionClient) {
    const { userId, action, entityId, entityType, metadata, req } = params;

    let ipAddress = 'system';
    let userAgent = 'system';

    if (req) {
      ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      userAgent = req.headers['user-agent'] || 'unknown';
    }

    const db = tx || this.prisma;

    try {
      await db.auditLog.create({
        data: {
          userId,
          action,
          entityId,
          entityType,
          metadata: metadata || {},
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log for ${action}`, error);
      if (tx) throw error; 
    }
  }

  // Advanced Filtering & Pagination
  async getLogs(query: { 
    page?: number; 
    limit?: number; 
    userId?: string;
    action?: AuditAction;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, userId, action, search, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
      ...(search && {
        OR: [
          { ipAddress: { contains: search, mode: 'insensitive' } },
          { entityId: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { 
        data: logs, 
        meta: { 
            total, 
            page, 
            lastPage: Math.ceil(total / limit) 
        } 
    };
  }

  // Security & Ops Summary
  async getAuditSummary() {
    const now = new Date();
    const last24h = subHours(now, 24);

    const [total24h, failedLogins24h, highRisk24h] = await Promise.all([
        // 1. Volume
        this.prisma.auditLog.count({
            where: { createdAt: { gte: last24h } }
        }),
        // 2. Security Threats
        this.prisma.auditLog.count({
            where: { 
                action: 'USER_LOGIN_FAILED',
                createdAt: { gte: last24h } 
            }
        }),
        // 3. Admin/Sensitive Actions
        this.prisma.auditLog.count({
            where: {
                action: { in: ['PROJECT_DELETED', 'PROJECT_SUSPENDED', 'WALLET_DEBIT'] },
                createdAt: { gte: last24h }
            }
        })
    ]);

    return {
        total24h,
        failedLogins24h,
        highRisk24h
    };
  }
}