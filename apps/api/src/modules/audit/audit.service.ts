import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditAction, Prisma } from '@givar/database';
import { Request } from 'express';

interface CreateLogParams {
  userId?: string;
  action: AuditAction;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  req?: Request; // Optional request object to extract IP/UA
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

    // Use the transaction client if provided, otherwise fallback to main prisma
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

  // Admin Only: View Logs
  async getLogs(query: { page?: number; limit?: number; userId?: string }) {
    const { page = 1, limit = 20, userId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = userId ? { userId } : {};

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

    return { data: logs, meta: { total, page, lastPage: Math.ceil(total / limit) } };
  }
}