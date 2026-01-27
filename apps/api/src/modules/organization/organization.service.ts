import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { VerificationStatus, AuditAction } from '@givar/database';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // 1. User: Submit KYC
  async submitKyc(userId: string, data: { legalName: string, registrationNumber?: string, documentKeys: string[] }) {
    return this.prisma.organizationProfile.upsert({
      where: { userId },
      update: {
        ...data,
        status: VerificationStatus.PENDING,
        adminFeedback: null,
      },
      create: {
        userId,
        ...data,
        status: VerificationStatus.PENDING,
      },
    });
  }

  // 2. Admin: Get Pending Verifications
  async getPendingVerifications() {
    return this.prisma.organizationProfile.findMany({
      where: { status: VerificationStatus.PENDING },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { updatedAt: 'asc' },
    });
  }

  // 3. Admin: Review Verification
  async reviewVerification(id: string, adminId: string, status: VerificationStatus, feedback?: string) {
    const profile = await this.prisma.organizationProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const updated = await this.prisma.organizationProfile.update({
      where: { id },
      data: {
        status,
        adminFeedback: feedback,
        verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
      },
    });

    // Audit the decision
    await this.audit.log({
      userId: adminId,
      action: status === VerificationStatus.VERIFIED ? AuditAction.PROJECT_UPDATED : AuditAction.PROJECT_DELETED, // Reusing actions or add USER_VERIFIED
      entityId: profile.userId,
      entityType: 'UserOrganization',
      metadata: { status, feedback, legalName: profile.legalName }
    });

    return updated;
  }

  async getProfileByUserId(userId: string) {
    return this.prisma.organizationProfile.findUnique({
      where: { userId },
    });
  }
}