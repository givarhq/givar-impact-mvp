import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Prisma, VerificationStatus, AuditAction, ProposalStatus, AccountType, NotificationType, UserRole } from '@givar/database';
import { AuditService } from '../audit/audit.service';
import { OrganizationQueryDto } from './dto/organization-query.dto';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notification: NotificationService,
    private readonly emailService: EmailService,
    private readonly storage: StorageService
  ) { }

  // 1. User: Submit KYC
  async submitKyc(userId: string, data: { legalName: string, registrationNumber?: string, documentKeys: string[], kycType: 'INDIVIDUAL' | 'ORGANIZATION' }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update or Create the Organization Profile
      const profile = await tx.organizationProfile.upsert({
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
        // We ensure email is fetched for the user email notification
        include: { user: { select: { email: true, firstName: true, lastName: true } } }
      });

      // 2. Fetch all Administrative Nodes
      const admins = await tx.user.findMany({
        where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } },
        select: { id: true }
      });

      // 3. Dispatch In-App Notifications
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type: 'KYC_STATUS' as NotificationType,
            title: 'KYC Review Required',
            content: `${profile.user.firstName} ${profile.user.lastName} submitted documents for "${data.legalName}" (${data.kycType}).`,
            link: '/admin/verifications?tab=orgs'
          }))
        });
      }

      return profile;
    }).then(async (profile) => {
      // 4. Trigger External Email Broadcast to Admins (Async)
      this.emailService.sendAdminKycAlert({
        orgName: data.legalName,
        proposerName: `${profile.user.firstName} ${profile.user.lastName}`
      }).catch(err => this.logger.error(`Admin KYC Email Failed: ${err.message}`));

      // 5. Trigger Confirmation Email to User (Async)
      this.emailService.sendKycSubmittedEmail(profile.user.email, {
        name: profile.user.firstName,
        kycType: profile.kycType
      }).catch(err => this.logger.error(`User KYC Submitted Email Failed: ${err.message}`));

      return profile;
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

    const result = await this.prisma.$transaction(async (tx) => {

      // 1. Update the Organization Profile
      const updated = await tx.organizationProfile.update({
        where: { id },
        data: {
          status,
          adminFeedback: feedback,
          verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
        },
      });

      // 2. State Convergence logic
      if (status === VerificationStatus.VERIFIED) {
        // --- PATH: APPROVAL ---

        if (updated.kycType === 'ORGANIZATION') {
          await tx.user.update({
            where: { id: updated.userId },
            data: { accountType: AccountType.ORGANIZER },
          });
        }

        const res = await tx.projectProposal.updateMany({
          where: {
            userId: updated.userId,
            status: ProposalStatus.AWAITING_VERIFICATION
          },
          data: {
            status: ProposalStatus.SUBMITTED,
            submittedAt: new Date()
          }
        });

        if (res.count > 0) {
          this.logger.log(`Auto-submitted ${res.count} proposals for verified user ${updated.userId}`);
        }

        // Notify user of successful verification
        await tx.notification.create({
          data: {
            userId: updated.userId,
            type: 'KYC_STATUS',
            title: 'Identity verified',
            content: `Your profile "${profile.legalName}" has been successfully verified. You can now launch public causes.`,
            link: '/dashboard/settings?tab=verification'
          }
        });
      } else if (status === VerificationStatus.REJECTED) {
        // --- PATH: REJECTION ---
        if (profile.kycType === 'ORGANIZATION') {
          await tx.user.update({
            where: { id: updated.userId },
            data: { accountType: AccountType.INDIVIDUAL },
          });
        }

        await tx.projectProposal.updateMany({
          where: {
            userId: updated.userId,
            status: ProposalStatus.AWAITING_VERIFICATION
          },
          data: {
            status: ProposalStatus.DRAFT,
            adminFeedback: `KYC Rejected: ${feedback || 'Please review your verification documents.'}`
          }
        });

        // Notify user of rejection with feedback
        await tx.notification.create({
          data: {
            userId: updated.userId,
            type: 'KYC_STATUS',
            title: 'Verification rejected',
            content: `We could not verify your identity at this time. Feedback: ${feedback || 'Please review your documents.'}`,
            link: '/dashboard/settings?tab=verification'
          }
        });
      }

      // 3. Audit the decision 
      await this.audit.log({
        userId: adminId,
        action: status === VerificationStatus.VERIFIED ? AuditAction.USER_VERIFIED : AuditAction.USER_REJECTED,
        entityId: profile.userId,
        entityType: 'UserOrganization',
        metadata: { status, feedback, legalName: profile.legalName, kycType: profile.kycType }
      }, tx);

      return updated;
    });

    // 4. Trigger Email Notification to the User depending on the outcome
    if (status === VerificationStatus.VERIFIED) {
      this.emailService.sendKycApprovedEmail(profile.user.email, {
        name: profile.user.firstName,
        kycType: profile.kycType
      }).catch(e => this.logger.error(`KYC Approved Email Failed: ${e.message}`));
    } else if (status === VerificationStatus.REJECTED) {
      this.emailService.sendKycRejectedEmail(profile.user.email, {
        name: profile.user.firstName,
        feedback: feedback || 'Please review your verification documents.'
      }).catch(e => this.logger.error(`KYC Rejected Email Failed: ${e.message}`));
    }

    return result;
  }

  async getProfileByUserId(userId: string) {
    return this.prisma.organizationProfile.findUnique({
      where: { userId },
    });
  }

  // Advanced Discovery Engine for Admins
  async findAllAdvanced(query: OrganizationQueryDto) {
    const {
      search, status, page = 1, limit = 20,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;

    // 1. Construct Dynamic Filter
    const where: Prisma.OrganizationProfileWhereInput = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { legalName: { contains: search, mode: 'insensitive' } },
          { registrationNumber: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    // 2. Construct Dynamic Order
    const orderBy = { [sortBy]: sortOrder };

    // 3. Parallel Execution
    const [profiles, total] = await Promise.all([
      this.prisma.organizationProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
              _count: { select: { projects: true } }
            }
          }
        }
      }),
      this.prisma.organizationProfile.count({ where }),
    ]);

    return {
      data: profiles,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async findOne(id: string) {
    const profile = await this.prisma.organizationProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            projects: {
              select: {
                id: true,
                title: true,
                status: true,
                raisedAmount: true,
                targetAmount: true,
                currency: true
              },
              orderBy: { createdAt: 'desc' }
            },
            _count: { select: { projects: true } }
          }
        }
      }
    });

    if (!profile) throw new NotFoundException('Organization not found');

    // Recursive Serialization for all nested projects and the profile itself
    return {
      ...profile,
      user: {
        ...profile.user,
        projects: profile.user.projects.map(p => ({
          ...p,
          raisedAmount: p.raisedAmount.toString(),
          targetAmount: p.targetAmount.toString(),
        }))
      }
    };
  }

  async getDocumentPreviewUrl(userId: string, key: string) {
    const profile = await this.prisma.organizationProfile.findUnique({
      where: { userId },
    });

    if (!profile || !profile.documentKeys.includes(key)) {
      throw new ForbiddenException('Access denied to this document');
    }

    return this.storage.getPresignedViewUrl(key);
  } s
}