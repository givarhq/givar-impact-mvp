import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { VerificationStatus, AuditAction, ProposalStatus } from '@givar/database';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) { }

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

    return this.prisma.$transaction(async (tx) => {

      // 1. Update the Organization Profile
      const updated = await tx.organizationProfile.update({
        where: { id },
        data: {
          status,
          adminFeedback: feedback,
          verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
        },
      });

      // 2. Logic: Auto-promote queued proposals
      if (status === VerificationStatus.VERIFIED) {
        const result = await tx.projectProposal.updateMany({
          where: {
            userId: updated.userId,
            status: ProposalStatus.AWAITING_VERIFICATION
          },
          data: {
            status: ProposalStatus.SUBMITTED,
            submittedAt: new Date()
          }
        });

        if (result.count > 0) {
          this.logger.log(`Auto-submitted ${result.count} proposals for verified user ${updated.userId}`);
        }
      }

      // 3. Audit the decision 
      await this.audit.log({
        userId: adminId,
        action: status === VerificationStatus.VERIFIED ? AuditAction.PROJECT_UPDATED : AuditAction.PROJECT_DELETED,
        entityId: profile.userId,
        entityType: 'UserOrganization',
        metadata: { status, feedback, legalName: profile.legalName }
      }, tx);

      return updated;
    });
  }

  async getProfileByUserId(userId: string) {
    return this.prisma.organizationProfile.findUnique({
      where: { userId },
    });
  }
}